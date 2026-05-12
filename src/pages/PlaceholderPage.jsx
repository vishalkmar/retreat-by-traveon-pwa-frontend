import TopBar from '../components/shell/TopBar.jsx';

// Stand-in for screens that will be built in the next iteration. Lets us
// wire up routes early so navigation works end-to-end.

const PlaceholderPage = ({ title = 'Coming soon', detail = 'This screen is being built next.' }) => (
  <div className="app-shell">
    <TopBar title={title} />
    <main className="flex-1 p-6">
      <p className="text-sm text-slate-500">{detail}</p>
    </main>
  </div>
);

export default PlaceholderPage;
