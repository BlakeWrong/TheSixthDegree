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
				main: appColor,
				contrastText: '#ffffff',
			},
			secondary: {
				main: '#ff6f61',
			},
			background: {
				default: '#f4f6f8', // General background
				paper: '#ffffff', // Background for cards and dialogs
			},
		},
		typography: {
			fontFamily: "'Poppins', 'Roboto', sans-serif",
			h1: {
				fontFamily: "'Poppins', sans-serif",
				fontWeight: 600,
				fontSize: '2rem',
			},
			h2: {
				fontFamily: "'Poppins', sans-serif",
				fontWeight: 500,
				fontSize: '1.75rem',
			},
			h3: {
				fontFamily: "'Poppins', sans-serif",
				fontWeight: 500,
				fontSize: '1.5rem',
			},
			body1: {
				fontFamily: "'Roboto', sans-serif",
				fontWeight: 400,
				fontSize: '1rem',
			},
			body2: {
				fontFamily: "'Roboto', sans-serif",
				fontWeight: 300,
				fontSize: '0.875rem',
			},
			button: {
				fontFamily: "'Poppins', sans-serif",
				textTransform: 'none', // Keep button text lowercase
				fontWeight: 500,
			},
		},
		components: {
			MuiDrawer: {
				styleOverrides: {
					paper: {
						borderRadius: '8px', // Rounded corners
						padding: '16px', // Internal padding
						boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)', // Shadow for depth
						backgroundColor: '#ffffff', // Background color
						width: '250px', // Drawer width
					},
				},
			},
			MuiList: {
				styleOverrides: {
					root: {
						padding: 0, // Remove default padding
					},
				},
			},
			MuiListItem: {
				styleOverrides: {
					root: {
						borderRadius: '4px',
						margin: '8px 0',
						'&:hover': {
							backgroundColor: '#f0f0f0', // Subtle hover effect
						},
					},
				},
			},
			MuiListItemButton: {
				styleOverrides: {
					root: {
						padding: '8px 16px',
						'&:hover': {
							backgroundColor: '#e0e0e0',
						},
					},
				},
			},
			MuiListItemText: {
				styleOverrides: {
					primary: {
						fontSize: '1rem',
						fontWeight: 500,
						color: '#002b80', // Text color matching primary theme color
					},
				},
			},
			// Style overrides for TextField
			MuiOutlinedInput: {
				styleOverrides: {
					root: {
						borderRadius: '8px', // Rounded corners
						backgroundColor: '#f8f9fa', // Light background
						boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow
						'&:hover .MuiOutlinedInput-notchedOutline': {
							borderColor: '#1976d2', // Lighter blue on hover
						},
						'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
							borderColor: appColor, // Deep navy on focus
						},
					},
					notchedOutline: {
						borderColor: '#ccc', // Default border color
					},
				},
			},
			// Style overrides for Dialog
			MuiDialog: {
				styleOverrides: {
					paper: {
						borderRadius: '16px', // Rounded corners
						padding: '20px', // Internal padding
						boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)', // Custom shadow
						backgroundColor: '#ffffff', // Dialog background
					},
				},
			},
			// Style overrides for DialogTitle
			MuiDialogTitle: {
				styleOverrides: {
					root: {
						fontSize: '1.25rem',
						fontWeight: 600,
						borderBottom: `1px solid #e0e0e0`,
						marginBottom: '1rem',
						paddingBottom: '8px',
					},
				},
			},
			// Style overrides for DialogContent
			MuiDialogContent: {
				styleOverrides: {
					root: {
						fontSize: '1rem',
						color: '#4a4a4a',
						lineHeight: '1.6',
					},
				},
			},
			// Style overrides for DialogActions
			MuiDialogActions: {
				styleOverrides: {
					root: {
						justifyContent: 'flex-end',
						paddingTop: '1rem',
						borderTop: `1px solid #e0e0e0`,
					},
				},
			},
			// Style overrides for Button inside dialogs
			MuiButton: {
				styleOverrides: {
					root: {
						textTransform: 'none',
						borderRadius: '8px',
						padding: '8px 16px',
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
					<Container width="100%" maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
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
