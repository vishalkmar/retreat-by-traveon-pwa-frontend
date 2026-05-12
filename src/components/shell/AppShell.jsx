// Mobile-first frame. Every authenticated screen renders inside this so
// the layout stays consistent (and we don't have to repeat sticky headers).

const AppShell = ({ children }) => (
  <div className="app-shell">{children}</div>
);

export default AppShell;
