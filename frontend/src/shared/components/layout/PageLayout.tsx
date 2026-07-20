import Navbar from "./Navbar";
import Footer from "./Footer";
import Toast from '@/shared/components/Toast';
// ...inside the layout's JSX, as a sibling to {children}

type Props = {
  children: React.ReactNode;
};

const PageLayout = ({ children }: Props) => {
  return (
    <>
      <Navbar />
      <Toast />
      <main>
        {children}
      </main>

      <Footer />
    </>
  );
};

export default PageLayout;