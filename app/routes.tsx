import type { RouteObject } from 'react-router';
import { AppShell, RouteBoundary } from '../src/ui/layout';
import { AccueilPage } from '../src/ui/pages/accueil/AccueilPage';
import { TransparencePage } from '../src/ui/pages/transparence/TransparencePage';
import { IntrouvablePage } from '../src/ui/pages/introuvable/IntrouvablePage';

// Chaque page a son errorElement : une page qui plante garde l'en-tête et le pied de page.
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteBoundary />,
    children: [
      { index: true, element: <AccueilPage />, errorElement: <RouteBoundary /> },
      { path: 'transparence', element: <TransparencePage />, errorElement: <RouteBoundary /> },
      { path: '*', element: <IntrouvablePage />, errorElement: <RouteBoundary /> },
    ],
  },
];
