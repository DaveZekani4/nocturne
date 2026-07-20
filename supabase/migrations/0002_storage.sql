-- ============================================================
-- Storage bucket for merch product images
-- ============================================================

insert into storage.buckets (id, name, public)
values ('merch-images', 'merch-images', true)
on conflict (id) do nothing;

-- Anyone can view merch images (public bucket, they're on a public storefront)
create policy "public can view merch images"
  on storage.objects for select
  using (bucket_id = 'merch-images');

-- Only admins can upload/replace/delete merch images
create policy "admins can upload merch images"
  on storage.objects for insert
  with check (bucket_id = 'merch-images' and is_admin());

create policy "admins can update merch images"
  on storage.objects for update
  using (bucket_id = 'merch-images' and is_admin());

create policy "admins can delete merch images"
  on storage.objects for delete
  using (bucket_id = 'merch-images' and is_admin());
