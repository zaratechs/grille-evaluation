import type { ReactNode } from 'react';
import { Navigate, type RouteObject } from 'react-router';
import { AppShell, RouteBoundary } from '../src/ui/layout';
import { DonneesPage } from '../src/ui/pages/donnees/DonneesPage';
import { EvaluationPage } from '../src/ui/pages/evaluation/EvaluationPage';
import { GrillePage } from '../src/ui/pages/grille/GrillePage';
import { GroupePage } from '../src/ui/pages/groupe/GroupePage';
import { IntrouvablePage } from '../src/ui/pages/introuvable/IntrouvablePage';
import { TransparencePage } from '../src/ui/pages/transparence/TransparencePage';

const page = (path: string, element: ReactNode): RouteObject => ({
  path,
  element,
  errorElement: <RouteBoundary />,
});

// Chaque page a son errorElement : une page qui plante garde l'en-tête et le pied de page.
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteBoundary />,
    children: [
      { index: true, element: <Navigate to="/grille" replace />, errorElement: <RouteBoundary /> },
      page('grille', <GrillePage />),
      page('evaluation', <EvaluationPage />),
      page('groupe', <GroupePage />),
      page('donnees', <DonneesPage />),
      page('transparence', <TransparencePage />),
      page('*', <IntrouvablePage />),
    ],
  },
];
