import React from 'react';
import {
	CssBaseline,
	Container,
	AppBar,
	Toolbar,
	Typography,
	Box,
	Link,
	IconButton,
	Button,
} from '@mui/material';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Link as RouterLink,
} from 'react-router-dom';
import { GitHub } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TabsContainer from './components/TabsContainer';
import About from './components/About';

function App() {
	const appColor = '#002b80';
	const theme = createTheme({
		palette: {
			primary: {
				main: '#002b80', // Deep navy
				contrastText: '#ffffff', // White text for better contrast
			},
			secondary: {
				main: '#ff6f61', // Optional accent color (can be replaced with another)
			},
			background: {
				default: '#f4f6f8', // Light gray background
			},
			text: {
				primary: '#001f3f', // Default text color
				secondary: '#4a4a4a', // Optional secondary text color
			},
		},
		components: {
			MuiButton: {
				styleOverrides: {
					root: {
						textTransform: 'none', // Disable uppercase for buttons
						borderRadius: '8px', // Rounded corners for buttons
					},
				},
			},
			MuiOutlinedInput: {
				styleOverrides: {
					root: {
						'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
							borderColor: '#002b80', // Deep navy border when focused
						},
					},
				},
			},
			MuiTab: {
				styleOverrides: {
					root: {
						textTransform: 'none', // Disable uppercase for tabs
						'&.Mui-selected': {
							color: '#002b80', // Deep navy for the selected tab
						},
					},
				},
			},
		},
	});

	return (
		<ThemeProvider theme={theme}>
			<Router>
				<Box
					sx={{
						bgcolor: '#dedede',
						minHeight: '100vh',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					<CssBaseline />
					<AppBar position="static" sx={{ bgcolor: appColor }}>
						<Toolbar>
							<img
								src="/clapperlogo.png"
								alt="Logo"
								style={{ height: '40px', marginRight: '1rem' }}
							/>
							<Typography variant="h6" component="div">
								The 6th Degree
							</Typography>
							<Button sx={{ ml: 4 }} component={RouterLink} to="/" color="inherit">
								Home
							</Button>
							<Button component={RouterLink} to="/about" color="inherit">
								About
							</Button>
						</Toolbar>
					</AppBar>
					<Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
						<Routes>
							<Route path="/" element={<TabsContainer />} />
							<Route path="/about" element={<About />} />
						</Routes>
					</Container>
					<Box
						component="footer"
						sx={{
							py: 3,
							textAlign: 'center',
							mt: 'auto',
							bgcolor: appColor,
							color: 'white',
						}}
					>
						<Typography variant="body2" sx={{ mb: 1 }}>
							© {new Date().getFullYear()} The 6th Degree. All rights reserved.
						</Typography>
						<Typography variant="body2" sx={{ mb: 2 }}>
							This product uses the TMDB API and Neo4j Aura but is not endorsed or
							certified by TMDB or Neo4j.
						</Typography>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								gap: 1,
							}}
						>
							<IconButton
								component="a"
								href="https://github.com/BlakeWrong"
								target="_blank"
								rel="noopener noreferrer"
								sx={{ color: 'white' }}
							>
								<GitHub />
							</IconButton>
							<Typography variant="body2">
								Created and maintained by{' '}
								<Link
									href="https://github.com/BlakeWrong"
									color="inherit"
									underline="always"
									target="_blank"
									rel="noopener noreferrer"
								>
									Blake Wright
								</Link>
							</Typography>
						</Box>
					</Box>
				</Box>
			</Router>
		</ThemeProvider>
	);
}

export default App;
