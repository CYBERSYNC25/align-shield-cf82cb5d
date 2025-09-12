-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('evidence', 'evidence', false),
  ('documents', 'documents', false);

-- Create policies for evidence bucket
CREATE POLICY "Users can upload their own evidence files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own evidence files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own evidence files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own evidence files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policies for documents bucket
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);