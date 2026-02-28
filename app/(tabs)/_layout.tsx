import { Tabs } from "expo-router";
import { TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native";

import edit from "../../assets/images/navbarIcons/edit.png";
import home from "../../assets/images/navbarIcons/home.png";
import shortcuts from "../../assets/images/navbarIcons/shortcuts.png";
import transactions from "../../assets/images/navbarIcons/transactions.png";
import add from"../../assets/images/navbarIcons/Add.png";
import addInverse from"../../assets/images/navbarIcons/addInverse.png";

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
          tabBarLabel: ()=> null,
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
           tabBarLabel: ()=> null,
        }}
      />

      <Tabs.Screen
        name="Add"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? addInverse : add}
              style={[styles.centerButton]}
            />
          ),
           tabBarLabel: ()=> null,
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
           tabBarLabel: ()=> null,
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
           tabBarLabel: ()=> null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    alignContent: "center",
    position: "absolute",
    bottom: 15,
    width: '90%',
    marginHorizontal: 'auto',
    maxWidth: 400,
    alignSelf: 'center',
    height: 70,
    backgroundColor: "#1d1d36",
    borderRadius: 40,
    elevation: 10,
    marginLeft: "5%",
    borderColor: "#1d1d36",
    borderWidth: 3,
  },
  centerButton: {
    top: -10,
    width: 55,
    height: 55,
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
  activeIconAdd: {
    tintColor: "#0e4481",
  },
});