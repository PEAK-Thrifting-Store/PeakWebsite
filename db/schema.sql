create table if not exists rails (
  id serial primary key,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id serial primary key,
  rail_id int references rails(id) on delete set null,
  title text,
  image_data bytea not null,
  image_type text not null default 'image/webp',
  image_version int not null default 1,
  instagram_url text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists posts_rail_idx on posts(rail_id, sort_order);

create table if not exists messages (
  id serial primary key,
  name text not null,
  contact text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists login_attempts (
  id serial primary key,
  ip text not null,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_ip_idx on login_attempts(ip, created_at);
