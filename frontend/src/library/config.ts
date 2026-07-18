import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig() || {};

export const hostUrl =
  publicRuntimeConfig?.hostUrl ||
  process.env.NEXT_PUBLIC_HOST_URL ||
  'http://localhost:3333';
