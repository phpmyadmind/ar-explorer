import { PlaceHolderImages } from './placeholder-images';

export interface Model {
  id: string;
  name: string;
  path: string;
  previewImage: string;
  scale: number;
  description: string;
  type: '3d' | 'video';
  url: string;
}

const getPreview = (id: string): string => {
  const image = PlaceHolderImages.find(p => p.id === id);
  return image ? image.imageUrl : '';
};

export const models: Model[] = [
  {
    id: 'armchair',
    name: 'Modern Armchair',
    path: '/models/armchair.glb',
    previewImage: getPreview('armchair-preview'),
    scale: 0.015,
    description: 'A comfortable and stylish armchair to fit any modern living space.',
    type: '3d',
    url: '/?model=armchair',
  },
  {
    id: 'bonsai',
    name: 'Bonsai Plant',
    path: '/models/bonsai.glb',
    previewImage: getPreview('bonsai-preview'),
    scale: 0.4,
    description: 'A beautiful bonsai plant to bring a sense of calm and nature indoors.',
    type: '3d',
    url: '/?model=bonsai',
  },
  {
    id: 'lamp',
    name: 'Desk Lamp',
    path: '/models/lamp.glb',
    previewImage: getPreview('lamp-preview'),
    scale: 0.3,
    description: 'A sleek and functional desk lamp for your workspace.',
    type: '3d',
    url: '/?model=lamp',
  },
  {
    id: 'isthis',
    name: 'Qué me está pasando',
    path: '/models/que-me-esta-pasando.mp4',
    previewImage: getPreview('que-me-esta-pasando-preview'),
    scale: 1,
    description: 'Obra de arte en video: ¿Qué me está pasando?',
    type: 'video',
    url: '/?model=isthis',
  },
  {
    id: 'noaguanto',
    name: 'Ya no aguanto más',
    path: '/models/ya-no-aguanto-mas.mp4',
    previewImage: getPreview('no-aguanto-mas-preview'),
    scale: 1,
    description: 'Obra de arte en video: Ya no aguanto más.',
    type: 'video',
    url: '/?model=noaguanto',
  },
];
