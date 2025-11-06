import { PlaceHolderImages } from './placeholder-images';

export interface Model {
  id: string;
  name: string;
  path: string;
  previewImage: string;
  scale: number;
  description: string;
  type: '3d' | 'video';
}

const armchairPreview = PlaceHolderImages.find(p => p.id === 'armchair-preview')?.imageUrl ?? '';
const bonsaiPreview = PlaceHolderImages.find(p => p.id === 'bonsai-preview')?.imageUrl ?? '';
const lampPreview = PlaceHolderImages.find(p => p.id === 'lamp-preview')?.imageUrl ?? '';
const whatIsThis = PlaceHolderImages.find(p => p.id === 'que-me-esta-pasando-preview')?.imageUrl ?? '';
const noAguanto = PlaceHolderImages.find(p => p.id === 'no-aguanto-mas-preview')?.imageUrl ?? '';

export const models: Model[] = [
  {
    id: 'armchair',
    name: 'Modern Armchair',
    path: '/models/armchair.glb',
    previewImage: armchairPreview,
    scale: 0.015,
    description: 'A comfortable and stylish armchair to fit any modern living space.',
    type: '3d',
  },
  {
    id: 'bonsai',
    name: 'Bonsai Plant',
    path: '/models/bonsai.glb',
    previewImage: bonsaiPreview,
    scale: 0.4,
    description: 'A beautiful bonsai plant to bring a sense of calm and nature indoors.',
    type: '3d',
  },
  {
    id: 'lamp',
    name: 'Desk Lamp',
    path: '/models/lamp.glb',
    previewImage: lampPreview,
    scale: 0.3,
    description: 'A sleek and functional desk lamp for your workspace.',
    type: '3d',
  },
  {
    id: 'isthis',
    name: 'Qué me está pasando',
    path: '/models/Cuadro No 01 EOT-que me esta pasando.mp4',
    previewImage: whatIsThis,
    scale: 1,
    description: 'Obra de arte en video: ¿Qué me está pasando?',
    type: 'video',
  },
  {
    id: 'noaguanto',
    name: 'Ya no aguanto más',
    path: '/models/Cuadro No 04 EOT-ya no aguanto mas.mp4',
    previewImage: noAguanto,
    scale: 1,
    description: 'Obra de arte en video: Ya no aguanto más.',
    type: 'video',
  },
];
