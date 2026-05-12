import { Outlet } from 'react-router-dom';

// Owners only have a handful of screens, so there's no bottom nav — just
// the outlet inside the standard app shell.

const OwnerLayout = () => (
  <div className="flex min-h-[100dvh] flex-col">
    <Outlet />
  </div>
);

export default OwnerLayout;
