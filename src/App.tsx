//import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import LifeWheel from './components/ui/LifeWheel';

// Pages
const MainPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Veiledningsverktøy</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/lifewheel" 
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Livshjulet</h2>
            <p className="text-gray-600">Kartlegge nåsituasjon i ulike områder av livet.</p>
          </Link>

          {/*<Link to="/tool2" 
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Tool 2</h2>
            <p className="text-gray-600">Description of tool 2</p>
          </Link> */}
        </div>
      </div>
    </div>
  );
};

// Tool Pages (simplified examples)
const LifeWheelContainer = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Tilbake
      </Link>
      <h1 className="text-3xl font-bold mb-8">Livshjulet</h1>
      <LifeWheel />
    </div>
  </div>
);

/*const Tool2 = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Tilbake
      </Link>
      <h1 className="text-3xl font-bold mb-8">Tool 2</h1>
      
    </div>
  </div>
);*/

// App Component with Routing
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/lifewheel" element={<LifeWheelContainer />} />
      </Routes>
    </Router>
  );
};

export default App;