interface Props {
  children?: React.ReactNode;
}

async function Layout({ children }: Props) {
  return <div>{children}</div>;
}

export default Layout;
