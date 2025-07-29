import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useContext } from "react";
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";

export default function Navbar(){
    const{token, setToken} = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('token');
        navigate('/login');
    };
    return(
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" style={{flexGrow:1}}> Smart Watse</Typography>
                {token?(
                    <>
                    <Button color="inherit" onClick={()=>navigate('/worker')}>Worker</Button>
                    <Button color="inherit" onClick={()=>navigate('/user')}>User</Button>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                    </>
                ):(
                  <Button color="inherit" onClick={()=>navigate('/login')}>Login</Button>
                )}
            </Toolbar>

        </AppBar>
        )
}