import React, { useState, useEffect } from 'react';
import { getInstruments, logout ,deleteInstrument, submitNewInstrument} from '../../api'; // Import API functions
import './styles.css';
import { useNavigate, Link} from 'react-router-dom';
import { Select, Space } from 'antd';


const AdminDashBoard = ({ token, onLogout }) => {
  const [instruments, setInstruments] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [instrumentType, setInstrumentType] = useState('CURRENCY');
  const [submittingNewInstrument, setSubmittingNewInstrument] = useState(false);
  const navigate = useNavigate();

// fetch instrument from the database
  const fetchInstruments = async () => {
    try {
      console.log("token in fetch instruments : ", token)
      const { data } = await getInstruments(token);
      setInstruments(data.instruments);
      console.log("Instrument: ", instruments)
    } catch (error) {
      alert('Error fetching your instruments.');
    }
  };

  useEffect(() => {
    fetchInstruments();
  }, [token]);

  const handleNewInstrument = () => {
    setSubmittingNewInstrument(true);
  };

  //handle create instrument

  const handleCreateInstrument = async () => {
    try {
      if (!symbol || !instrumentType) {
        alert('All fields are required!');
        return;
      }
      await submitNewInstrument(
        {
          instrumentType,
          symbol,
        },
        token
      );

      setSubmittingNewInstrument(false);
      alert('Instrument submitted successfully!');
      fetchInstruments(); 

      }catch (error) {
      alert('Error creating the instrument.');
    }
  };

  //handle delete instrument

  const handleDeleteInstrument = async (id) => {
    try {
      const response = await deleteInstrument(id, token); 
      console.log(response)

      if (response.data.error) {
        alert(response.data.error)
        return
      }

      alert('Instrument deleted successfully!');
      fetchInstruments();
    } catch (error) {
      alert('Error deleting the instrument.');
    }
  };

  //Handle logout
  const handleLogout = async () => {
    try {
      await logout(token);
      onLogout();
      navigate('/');
      

    } catch (error) {
      console.log(error);
      alert('Error in logout.');
    }

  };

  const handleChange = (value) => {
    console.log(`selected ${value}`);
    setInstrumentType(value)
  };
  
  return (
  <div className="page-container">
      <div className="top-space">
        <button className="logout-btn" onClick={() => handleLogout()}>
          Logout
        </button>
      </div>
    <div className="split-container">
      {/* Left section: Your Instruments */}
      <div className="right-section">
        <div className="order-container">
          <div className="header-row">
            <h3>Instruments</h3>
            <button className="new-order-btn" onClick={() => handleNewInstrument()}>
              New Instrument
            </button>
          </div>
          {instruments.length === 0 ? (
            <p>No Instruments found.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>instrumentType</th>
                  <th>symbol</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {instruments.map((instrument) => (
                  <tr key={instrument._id}>
                    <td>{instrument.instrumentType}</td>
                    <td>{instrument.symbol}</td>
                    <td>
                      <button
                        className="cancel-btn"
                        onClick={() => handleDeleteInstrument(instrument._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        {/* New instrument Form */}
          {submittingNewInstrument && (
            <div className="new-order-form">
              <h4>New Instrument</h4>
              <div className="input-group">
                <label>Symbol: </label>
                <input
                  onChange={(e) => setSymbol(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Instrument Type: </label>
                <Select
                  defaultValue="CURRENCY"
                  style={{
                    width: 120,
                  }}
                  onChange={handleChange}
                  options={[
                    {
                      value: 'CURRENCY',
                      label: 'CURRENCY',
                    },
                    {
                      value: 'COMMODITY',
                      label: 'COMMODITY',
                    },
                  ]}
                />
               
              </div>
              <button className="update-btn" onClick={handleCreateInstrument}>
                Submit Instrument
              </button>
              <button
                className="cancel-edit-btn"
                onClick={() => setSubmittingNewInstrument(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default AdminDashBoard;
