import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router';
import { routes } from './routes';
import '../src/ui/tailwind.css';

const racine = document.getElementById('root');
if (!racine) throw new Error('#root introuvable dans index.html');

// Routeur à hash (#/…) : le site reste statique, un rechargement fonctionne partout.
const router = createHashRouter(routes);

createRoot(racine).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
