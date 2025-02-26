import { GetServerSideProps } from 'next';

export default function Index() {
  // This should never be rendered because of the redirect
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/hello',
      permanent: true, // Use true for a 308 permanent redirect
    },
  };
}; 