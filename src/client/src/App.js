import './App.css';
import { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';

const App = () => {
  const [] = useState();
  const handleCreateTeam = () => {
    api;
  };
  fetch('/api/getList')
    .then((res) => res.json())
    .then((list) => this.setState({ list }));
  return (
    <>
      <InputLabel>Setup your team</InputLabel>
      <TextField placeholder={'Choose Team Name'} />
      <Button onClick={handleCreateTeam}>Create Team</Button>
      <hr />
      <InputLabel>Start where you left off</InputLabel>
      <TextField placeholder={'Team Name'} /> <Button>Start</Button>
    </>
  );
};

export default App;
