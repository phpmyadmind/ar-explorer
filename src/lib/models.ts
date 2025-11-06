export interface Model {
  id: string;
  name: string;
  path: string;
  previewImage: string; // URL a la imagen de vista previa
  scale: number;
  description: string;
  type: '3d-model' | 'video' | 'image';
  url: string; // URL para el código QR
}
