import React, { useState, Component } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Home from './pages/Home';
import AuthForm from './pages/AuthForm';
import Register from './pages/Register';
import SeekerProfile from './pages/SeekerProfile';
import ProviderProfile from './pages/ProviderProfile';
import SeekerDashboard from './pages/SeekerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import JobsList from './pages/JobsList';

const Stack = createStackNavigator();

// Custom themes for better alignment with JobsList UI
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f5f5f5', // Soft white from JobsList
    card: '#fff',
    text: '#333', // High-contrast text
    primary: '#007AFF', // Blue accent
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#1a1a1a', // CRED-like rich black
    card: '#2a2a2a',
    text: '#fff', // White text
    primary: '#00cc99', // Neon green accent
  },
};

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    console.log('Error caught:', error.message);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error details:', error, errorInfo);
  }

  render() {
    const { isDarkMode } = this.props; // Pass isDarkMode from App
    if (this.state.hasError) {
      return (
        <View style={[styles.errorContainer, isDarkMode ? styles.darkErrorContainer : styles.lightErrorContainer]}>
          <Text style={[styles.errorText, isDarkMode ? styles.darkErrorText : styles.lightErrorText]}>
            Oops! Something went wrong: {this.state.error?.message}
          </Text>
          <Text style={[styles.errorSubText, isDarkMode ? styles.darkErrorText : styles.lightErrorText]}>
            Please try refreshing the app.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  console.log('App rendering');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={isDarkMode ? CustomDarkTheme : CustomLightTheme}>
        <ErrorBoundary isDarkMode={isDarkMode}>
          <View style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
            <Stack.Navigator initialRouteName="JobsList">
              <Stack.Screen 
                name="JobsList" 
                options={{ headerShown: false }} 
                children={props => <JobsList {...props} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
              />
              <Stack.Screen 
                name="Home" 
                options={{ headerShown: false, headerLeft: () => null }} 
                children={props => <Home {...props} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
              />
              <Stack.Screen 
                name="AuthForm" 
                options={{ headerShown: false }} 
                children={props => <AuthForm {...props} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
              />
              <Stack.Screen 
                name="Register" 
                options={{ headerShown: false }} 
                children={props => <Register {...props} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
              />
              <Stack.Screen 
                name="SeekerProfile" 
                options={{ headerShown: false }} 
                children={props => <SeekerProfile {...props} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
              />
              <Stack.Screen 
                name="ProviderProfile" 
                options={{ headerShown: false }} 
                children={props => <ProviderProfile {...props} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
              />
              <Stack.Screen 
                name="SeekerDashboard" 
                options={{ headerShown: false }} 
                children={props => <SeekerDashboard {...props} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
              />
              <Stack.Screen 
                name="ProviderDashboard" 
                options={{ headerShown: false }} 
                children={props => <ProviderDashboard {...props} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
              />
              <Stack.Screen 
                name="AdminDashboard" 
                options={{ headerShown: false }} 
                children={props => <AdminDashboard {...props} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
              />
            </Stack.Navigator>
          </View>
        </ErrorBoundary>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  lightContainer: { 
    backgroundColor: '#f5f5f5', // Matches JobsList light mode
  },
  darkContainer: { 
    backgroundColor: '#1a1a1a', // Matches JobsList dark mode
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
  },
  lightErrorContainer: { 
    backgroundColor: '#f5f5f5',
  },
  darkErrorContainer: { 
    backgroundColor: '#1a1a1a',
  },
  errorText: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 10,
  },
  lightErrorText: { 
    color: '#333', // High contrast for light mode
  },
  darkErrorText: { 
    color: '#fff', // White for dark mode
  },
  errorSubText: { 
    fontSize: 16, 
    textAlign: 'center',
  },
});