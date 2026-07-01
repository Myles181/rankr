"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const LandingPage_1 = require("./pages/LandingPage");
const ArtistDashboard_1 = require("./pages/ArtistDashboard");
const FanDashboard_1 = require("./pages/FanDashboard");
function App() {
    return (<react_router_dom_1.BrowserRouter>
      <react_router_dom_1.Routes>
        <react_router_dom_1.Route path="/" element={<LandingPage_1.default />}/>
        <react_router_dom_1.Route path="/artist" element={<ArtistDashboard_1.default />}/>
        <react_router_dom_1.Route path="/fan" element={<FanDashboard_1.default />}/>
      </react_router_dom_1.Routes>
    </react_router_dom_1.BrowserRouter>);
}
exports.default = App;
//# sourceMappingURL=App.js.map