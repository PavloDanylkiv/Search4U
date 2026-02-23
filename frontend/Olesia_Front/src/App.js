import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AccountPage from './AccountPage';

function App() {
  return (
    <div className="App">
      <AccountPage />
    </div>
  );
}

export default App;
// const HomePage = () => {
//   return (
//     <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
//       <h1>🏠 Home Page</h1>
//       <p>You successfully navigated to another page!</p>
//       {/* A link to go back to the account page */}
//       <a href="/account">Go to My Account</a>
//     </div>
//   );
// };

// function App() {
//   return (
//     <Router>
//       <div className="App">
//         {/* The Routes block holds all your different pages */}
//         <Routes>
//           {/* If the URL is exactly "/" (your main website link), show HomePage */}
//           <Route path="/" element={<HomePage />} />

//           {/* If the URL is "/account", show your AccountPage */}
//           <Route path="/account" element={<AccountPage />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;
