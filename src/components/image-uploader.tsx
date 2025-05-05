'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageUpload, disabled = false }: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null); // Clear previous errors
    if (rejectedFiles.length > 0) {
      setError(`File rejected: ${rejectedFiles[0].errors[0].message}`);
      return;
    }
    if (acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0]);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
    maxSize: 10 * 1024 * 1024, // 10MB limit
    multiple: false,
    disabled: disabled,
  });

  const handleManualUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          if (file.size > 10 * 1024 * 1024) {
              setError("File is too large (max 10MB).");
              return;
          }
          if (!file.type.startsWith('image/')) {
              setError("Invalid file type. Please upload an image.");
              return;
          }
          onImageUpload(file);
      }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
       {error && (
        <Alert variant="destructive" className="w-full">
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div
        {...getRootProps()}
        className={`w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-primary'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} id="file-upload" className="sr-only" />
        <div className="flex flex-col items-center text-center text-muted-foreground">
          <Upload className="h-12 w-12 mb-4" />
          {isDragActive ? (
            <p>Drop the image here ...</p>
          ) : (
            <p>Drag 'n' drop an image here, or click to select one</p>
          )}
          <p className="text-sm mt-2">(Max 10MB, JPG, PNG, WEBP)</p>
        </div>
      </div>
       <Label htmlFor="file-upload-button" className="sr-only">Upload an image</Label>
      <Button asChild variant="outline" disabled={disabled}>
          <label htmlFor="file-upload-button" className={`cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}>
              <Upload className="mr-2 h-4 w-4" /> Select Image Manually
          </label>
      </Button>
      <Input
        id="file-upload-button"
        type="file"
        className="hidden"
        onChange={handleManualUpload}
        accept="image/*"
        disabled={disabled}
        aria-hidden="true" // Hide from screen readers as button triggers it
      />

    </div>
  );
}
