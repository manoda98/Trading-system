import React, { useState, useEffect } from 'react';
import { getInstruments, logout ,deleteInstrument, submitNewInstrument, getUsers, deposit, withdraw} from '../../api'; // Import API functions
import './styles.css';
import { useNavigate, Link} from 'react-router-dom';
import { Select, Space } from 'antd';


const AdminDashBoard = ({ token, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState();
  const [userOptions, setUserOptions] = useState([]);
  const [symbolOptions, setSymbolOption] = useState([])
  const [instruments, setInstruments] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [instrumentType, setInstrumentType] = useState('CURRENCY');
  const [submittingNewInstrument, setSubmittingNewInstrument] = useState(false);
  const [adjustBalance, setAdjustBalance] = useState(false);
  const [balanceAdjustSymbol, setBalanceAdjustSymbol] = useState('');
  const [balance, setBalance] = useState('');
  const [selectedAction, setSelectedAction] = useState("Deposit")
  const navigate = useNavigate();

// fetch instrument from the database
  const fetchInstruments = async () => {
    try {
      const { data } = await getInstruments({}, token);
      setInstruments(data.instruments);
    } catch (error) {
      console.log(error)
      alert('Error fetching your instruments.');
    }
  };

//fetch users from the database
const fetchUsers = async () => {
  try {
    const { data } = await getUsers(token);
    console.log("data", data)
    console.log("data.users", data.users)
    setUsers(data.users)
  } catch (error) {
    alert('Error fetching your users.');
  }
};

useEffect(() => {
  let optionsList = [
    { value: '', label: 'Please select user' }
  ]
  
  for (const user of users) {
    optionsList.push(
      { value: user.userId, label: user.userId }
    )
  }

  setUserOptions(optionsList);

  if (selectedUser) {
    handleSelectedUser(selectedUser.userId)
  }

}, [users]);


useEffect(() => {
  let symbolOptionList = [
    { value: '', label: 'select symbol'}
  ]

  for (const instrument of instruments) {
    symbolOptionList.push(
      {value: instrument.symbol, label: instrument.symbol}
    )
  }

  setSymbolOption(symbolOptionList);
}, [instruments]);



//handle user balances
/*const fetchUserBalances = async (userId) => {
  try {
    const { data } = await getBalance(userId, token);
    setBalance(data.balances);
  } catch (error) {
    console.log(error);
    alert('Error fetching search user.');
  }

};*/

  useEffect(() => {
    fetchInstruments();
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  //handle search user


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
      alert('Instrument Created successfully!');
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
  
//handle selected user
  const handleSelectedUser = (value) => {
    console.log("value :", value)
    const user = users.find((u) => u.userId === value);
    setSelectedUser(user);
    setAdjustBalance(false)
    setSelectedAction('Deposit')
    setBalanceAdjustSymbol('')
    setBalance('')
    console.log("user :", user)
  };

  

  //handle user balances(deposit/withdraw)
  const adjustUserBalance = async () => {
      try {
        if (!(selectedUser.userId) || !balanceAdjustSymbol || !balance) {
          alert('All fields are required!');
          return;
        }
        if (selectedAction == "Deposit") {
          await deposit(
            {
              userId: selectedUser.userId,
              symbol: balanceAdjustSymbol,
              amount: balance,
            },
            token
          );
    
          setAdjustBalance(false);
          alert('Amount deposit successfully!');
          fetchUsers(); 

          return

        } else {
          await withdraw(
            {
              userId: selectedUser.userId,
              symbol: balanceAdjustSymbol,
              amount: balance,
            },
            token
          );
    
          setAdjustBalance(false);
          alert('Amount withdraw successfully!');
          fetchUsers(); 
        }
        }catch (error) {
        alert('Error adjust balances.');
      }
    };
  
  return (
  <div className="page-container">
      <div className="top-space">
        <button className="logout-btn" onClick={() => handleLogout()}>
          Logout
        </button>
      </div>
    <div className="split-container">
      
      <div className="left-section">
        <div className="order-container">
          <div className="header-row">
            <h3>User Balances</h3>
            <div className="input-group">
              <label>Enter User ID: </label>
              <Select
               defaultValue=""
               style={{ width: 120 }}
              onChange={handleSelectedUser}
              options={userOptions}> 
              </Select>       
            </div>
            <button className="new-order-btn" onClick={setAdjustBalance}>
              Adjust
            </button>
          </div>
        {/* Search Results */}
        {selectedUser && (
          <div className="search-results">
            <h4>User Accounts</h4>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>symbol</th>
                  <th>Current Balance</th>
                </tr>
              </thead>
              <tbody>
              {selectedUser.balances.map((balanceRecord) => (
                <tr>
                  <td>{balanceRecord.symbol}</td>
                  <td>{balanceRecord.balance}</td>
                </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {adjustBalance && (
            <div className="new-order-form">
              <h4>Deposit and Withdraw</h4>
              <div className="input-group">
                <label>Symbol: </label>
              <Select
                defaultValue=""
                style={{ width: 120 }}
                onChange={ (value) => {
                  setBalanceAdjustSymbol(value)
                }}
                options={symbolOptions}> 
              </Select>       
              </div>
              <div className="input-group">
                <label>Diposit/withdraw: </label>
                <Select
                  defaultValue="Deposit"
                  style={{
                    width: 120,
                  }}
                  onChange={(value) => {
                    setSelectedAction(value);
                  }}
                  options={[
                    {
                      value: 'Deposit',
                      label: 'Deposit',
                    },
                    {
                      value: 'Withdraw',
                      label: 'Withdraw',
                    },
                  ]}
                />
               
              </div>
              <div className="input-group">
                <label>Amount: </label>
                <input
                type="number"
                  onChange={(e) => setBalance(parseFloat(e.target.value))}
                />
              </div>
              <button className="update-btn" onClick={adjustUserBalance}>
                Submit 
              </button>
              <button
                className="cancel-edit-btn"
                onClick={() => setAdjustBalance(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      {/* right section:  Instruments */}
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
