import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function TabBarIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const map: any = { 
    home: focused ? 'home' : 'home-outline', 
    qr: focused ? 'qr-code' : 'qr-code-outline', 
    sos: focused ? 'alert-circle' : 'alert-circle-outline', 
    record: focused ? 'clipboard' : 'clipboard-outline', 
    edu: focused ? 'book' : 'book-outline' 
  };
  return <Ionicons name={map[name]} size={24} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#db2777',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { borderTopWidth: 0, elevation: 10, height: 65, paddingBottom: 10, paddingTop: 5 },
      headerStyle: { backgroundColor: '#db2777' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' }
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'My Dashboard',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: 'My Card',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="qr" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'Emergency',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="sos" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="record" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="education"
        options={{
          title: 'Health Tips',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="edu" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
