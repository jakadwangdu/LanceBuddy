import React from 'react';
import { ErrorPage } from './ErrorPage';

export const NotFoundPage = () => {
  return <ErrorPage code={404} />;
};
