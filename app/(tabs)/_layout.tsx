import { Tabs } from "expo-router";
import { TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native";

import edit from "../../assets/images/navbarIcons/edit.png";
import home from "../../assets/images/navbarIcons/home.png";
import shortcuts from "../../assets/images/navbarIcons/shortcuts.png";
import transactions from "../../assets/images/navbarIcons/transactions.png";

  const {width} = Dimensions.get('window');

  const TAB_BAR_WIDTH = width * 0.9;

export default function TabsLayout() {


  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
      }}
    
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={home}
              style={[styles.icon, focused && styles.activeIcon]}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Shortcuts"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={shortcuts}
              style={[styles.icon, focused && styles.activeIcon]}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Transactions"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={transactions}
              style={[styles.icon, focused && styles.activeIcon]}
            />
          ),
        }}
      />

    

      <Tabs.Screen
        name="Edit"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={edit}
              style={[styles.icon, focused && styles.activeIcon]}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 26,
    width: '100%',
    marginHorizontal: 'auto',
    maxWidth: 400,
    alignSelf: 'center',
    height: 70,
    backgroundColor: "#1d1d5c",
    borderRadius: 20,
    elevation: 10,
  },
  centerButton: {
    top: -25,
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  icon: {
    marginTop: 30,
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  activeIcon: {
    tintColor: "#83b9f8",
  },
});