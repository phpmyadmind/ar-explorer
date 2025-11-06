import { PlaceHolderImages } from './placeholder-images';

export interface Model {
  id: string;
  name: string;
  path: string;
  previewImage: string;
  scale: number;
  description: string;
  type: '3d-model' | 'video' | 'image';
  url: string;
}

const findImage = (id: string) => {
  const img = PlaceHolderImages.find(p => p.id === id);
  if (!img) {
    // Return a default or error image path if not found
    return '/models/placeholder.png';
  }
  return img.imageUrl;
};

export const staticModels: Model[] = [
  {
    id: 'que-me-esta-pasando',
    name: 'Qué me está pasando',
    path: 'http://localhost:5000/uploads/que-me-esta-pasando.mp4',
    previewImage: findImage('que-me-esta-pasando-preview'),
    scale: 1,
    description: "Videoarte EOT",
    type: 'video',
    url: '/?model=que-me-esta-pasando'
  },
  {
    id: 'no-aguanto-mas',
    name: 'Ya no aguanto más',
    path: 'http://localhost:5000/uploads/ya-no-aguanto-mas.mp4',
    previewImage: findImage('no-aguanto-mas-preview'),
    scale: 1,
    description: "Videoarte EOT",
    type: 'video',
    url: '/?model=no-aguanto-mas'
  },
  {
    id: 'tercer-video',
    name: 'Tercer Video',
    path: 'http://localhost:5000/uploads/tercer-video.mp4',
    previewImage: findImage('tercer-video-preview'),
    scale: 1,
description: "Videoarte EOT",
    type: 'video',
    url: '/?model=tercer-video'
  }
];
