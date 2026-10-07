create schema bsd_private;
revoke all on schema bsd_private from public,anon,authenticated;
create table bsd_private.reviews(id uuid primary key default gen_random_uuid(), name text not null, business text not null, email text not null, rating int not null check(rating between 1 and 5), review text not null, ip_hash text not null, created_at timestamptz not null default now());
create table bsd_private.owner(email text primary key, password_hash text not null);
create table bsd_private.sessions(token_hash text primary key, expires_at timestamptz not null);
create table bsd_private.login_attempts(ip_hash text not null, created_at timestamptz not null default now());
alter table bsd_private.reviews enable row level security;
alter table bsd_private.owner enable row level security;
alter table bsd_private.sessions enable row level security;
alter table bsd_private.login_attempts enable row level security;
revoke all on all tables in schema bsd_private from public,anon,authenticated;
create function public.bsd_reviews_list() returns jsonb language sql security definer set search_path='' as $$ select coalesce(jsonb_agg(r),'[]'::jsonb) from (select id,name,business,rating,review,created_at from bsd_private.reviews order by created_at desc limit 100) r $$;
create function public.bsd_review_submit(reviewer_name text,business_name text,reviewer_email text,stars int,review_text text,client_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
 if reviewer_name is null or business_name is null or reviewer_email is null or review_text is null or stars is null or client_hash is null or length(trim(reviewer_name)) not between 1 and 120 or length(trim(business_name)) not between 1 and 180 or length(trim(review_text)) not between 10 and 1800 or stars not between 1 and 5 or reviewer_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(reviewer_email)>254 then raise exception 'Invalid review' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(client_hash,0));
 if (select count(*) from bsd_private.reviews where ip_hash=client_hash and created_at>now()-interval '10 minutes')>=3 or exists(select 1 from bsd_private.reviews where email=lower(trim(reviewer_email)) and created_at>now()-interval '10 minutes') then raise exception 'Please wait before submitting another review'; end if;
 insert into bsd_private.reviews(name,business,email,rating,review,ip_hash) values(trim(reviewer_name),trim(business_name),lower(trim(reviewer_email)),stars,trim(review_text),client_hash) returning id into new_id;
 return new_id;
end; $$;
create function public.bsd_review_login(owner_email text,owner_password text,client_hash text) returns text language plpgsql security definer set search_path='' as $$
declare token text;
begin
 perform pg_advisory_xact_lock(hashtextextended('bsd-login-'||client_hash,0));
 delete from bsd_private.login_attempts where created_at<now()-interval '1 day';
 if (select count(*) from bsd_private.login_attempts where ip_hash=client_hash and created_at>now()-interval '15 minutes')>=5 then return null; end if;
 insert into bsd_private.login_attempts(ip_hash) values(client_hash);
 if not exists(select 1 from bsd_private.owner where email=lower(trim(owner_email)) and password_hash=extensions.crypt(owner_password,password_hash)) then return null; end if;
 token=encode(extensions.gen_random_bytes(32),'hex');
 delete from bsd_private.sessions where expires_at<now();
 insert into bsd_private.sessions(token_hash,expires_at) values(encode(extensions.digest(token,'sha256'),'hex'),now()+interval '8 hours');
 return token;
end; $$;
create function public.bsd_review_owner(session_token text) returns boolean language sql security definer set search_path='' as $$ select exists(select 1 from bsd_private.sessions where token_hash=encode(extensions.digest(session_token,'sha256'),'hex') and expires_at>now()) $$;
create function public.bsd_review_delete(review_id uuid,session_token text) returns boolean language plpgsql security definer set search_path='' as $$ begin if not public.bsd_review_owner(session_token) then raise exception 'Owner access only' using errcode='42501'; end if; delete from bsd_private.reviews where id=review_id; return found; end; $$;
create function public.bsd_review_logout(session_token text) returns void language sql security definer set search_path='' as $$ delete from bsd_private.sessions where token_hash=encode(extensions.digest(session_token,'sha256'),'hex') $$;
revoke all on function public.bsd_reviews_list(),public.bsd_review_submit(text,text,text,int,text,text),public.bsd_review_login(text,text,text),public.bsd_review_owner(text),public.bsd_review_delete(uuid,text),public.bsd_review_logout(text) from public,anon,authenticated;
grant execute on function public.bsd_reviews_list(),public.bsd_review_submit(text,text,text,int,text,text),public.bsd_review_login(text,text,text),public.bsd_review_owner(text),public.bsd_review_delete(uuid,text),public.bsd_review_logout(text) to service_role;
