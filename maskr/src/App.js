import React, { useState, useEffect } from "react";
import axios from "axios";
function App() {
  const [mask, setMask] = useState();
  const [name, setName] = useState("shoray");
  useEffect(() => {
    axios
      .get("/members")
      .then((res) => {
        setMask(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const poster = () => {
    axios
      .post("/members", {
        name: name,
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if (!mask) {
    return <div>Loading...</div>;
  } else {
    return (
      <>
        {mask["members"].map((i) => (
          <div key={i}>{i}</div>
        ))}
        {/* add a text box */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {/* add a button */}
        <button onClick={poster}>Add</button>
      </>
    );
  }
}

export default App;
