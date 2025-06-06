import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import AdminPanel from '../screens/AdminPanel';
import UserManagementScreen from '../screens/UserManagementScreen';
import TestManagement from '../screens/TestManagementScreen';
import TextbookManagement from '../screens/TextbookManagementScreen';

const Stack = createStackNavigator();

const AdminStack = () => {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B2454',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 20,
        },
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        cardStyle: {
          backgroundColor: '#f8f9fa',
        },
      }}
    >
      <Stack.Screen 
        name="AdminPanel" 
        component={AdminPanel} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="UserManagement" 
        component={UserManagementScreen} 
        options={{ 
          title: 'User Management',
          headerShown: true,
          headerLeftContainerStyle: { paddingLeft: 16 },
        }}
      />
      <Stack.Screen 
        name="TestManagement" 
        component={TestManagement} 
        options={{ 
          title: 'Test Management',
          headerShown: true,
          headerLeftContainerStyle: { paddingLeft: 16 },
        }}
      />
      <Stack.Screen 
        name="TextbookManagement" 
        component={TextbookManagement} 
        options={{ 
          title: 'Textbook Management',
          headerShown: true,
          headerLeftContainerStyle: { paddingLeft: 16 },
        }}
      />
    </Stack.Navigator>
  );
};

export default AdminStack;