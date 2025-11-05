import { PlaceHolderImages } from './placeholder-images';

export interface Model {
  id: string;
  name: string;
  path: string;
  previewImage: string;
  scale: number;
  description: string;
}

const armchairPreview = PlaceHolderImages.find(p => p.id === 'armchair-preview')?.imageUrl ?? '';
const bonsaiPreview = PlaceHolderImages.find(p => p.id === 'bonsai-preview')?.imageUrl ?? '';
const lampPreview = PlaceHolderImages.find(p => p.id === 'lamp-preview')?.imageUrl ?? '';

export const models: Model[] = [
  {
    id: 'armchair',
    name: 'Modern Armchair',
    path: '/models/armchair.glb',
    previewImage: armchairPreview,
    scale: 0.015,
    description: 'A comfortable and stylish armchair to fit any modern living space.'
  },
  {
    id: 'bonsai',
    name: 'Bonsai Plant',
    path: '/models/bonsai.glb',
    previewImage: bonsaiPreview,
    scale: 0.4,
    description: 'A beautiful bonsai plant to bring a sense of calm and nature indoors.'
  },
  {
    id: 'lamp',
    name: 'Desk Lamp',
    path: '/models/lamp.glb',
    previewImage: lampPreview,
    scale: 0.3,
    description: 'A sleek and functional desk lamp for your workspace.'
  },
];
