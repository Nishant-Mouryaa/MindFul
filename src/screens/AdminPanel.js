// screens/AdminPanel.js   (pure JS)
import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Provider as PaperProvider,
  Appbar,
  Card,
  Title,
  Button,
  useTheme,
  Badge,
  Avatar,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { AdminDarkTheme } from '../theme';     // ← dark palette / theme
import { AdminPalette }   from '../theme/colors'; 

import AdminOnly            from '../components/AdminOnly';
import TextbookManagementScreen from './TextbookManagementScreen';
import TestManagementScreen     from './TestManagementScreen';
import UserManagementScreen     from './UserManagementScreen';

const Tab   = createMaterialBottomTabNavigator();
const { width } = Dimensions.get('window');

/* ───────────────────────────── Admin DASHBOARD ───────────────────────────── */
const AdminDashboard = ({ navigation }) => {
  const { colors } = useTheme();                       // colours come from AdminDarkTheme
  const styles      = React.useMemo(() => makeStyles(colors), [colors]);

  /* fade-in */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [fadeAnim]);

  /* header shrink on scroll */
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight     = scrollY.interpolate({ inputRange:[0,100], outputRange:[220,100], extrapolate:'clamp' });
  const avatarScale      = scrollY.interpolate({ inputRange:[0,100], outputRange:[1,0.7], extrapolate:'clamp' });
  const avatarTranslateY = scrollY.interpolate({ inputRange:[0,100], outputRange:[0,-20], extrapolate:'clamp' });

  /* feature buttons */
  const features = [
    {
      title: 'Content Management',
      buttons: [
        { label:'Manage Textbooks', icon:'book-open-page-variant',
          action:()=>navigation.navigate('TextbookManagement'), color:'#7c4dff', count:42 },
        { label:'Manage Tests',     icon:'file-document-multiple',
          action:()=>navigation.navigate('TestManagement'),   color:'#00bcd4', count:18 },
      ],
    },
    {
      title: 'User Management',
      buttons: [
        { label:'Manage Users', icon:'account-supervisor',
          action:()=>navigation.navigate('UserManagement'), color:'#ff9800', count:156 },
        { label:'View Analytics', icon:'chart-areaspline',
          action:()=>navigation.navigate('Analytics'), color:'#4caf50' },
      ],
    },
  ];

  /* ─────────────────── JSX ─────────────────── */
  return (
    <View style={styles.screenWrapper}>
      <View style={styles.circle1}/>
      <View style={styles.circle2}/>

      <StatusBar backgroundColor={AdminPalette.primary} barStyle="light-content" />

      {/* HEADER */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Admin Dashboard" titleStyle={styles.headerTitle} />
          <Appbar.Action icon="bell-outline" onPress={()=>{}} color="#fff" />
          <Appbar.Action icon="logout"      onPress={()=>navigation.navigate('Login')} color="#fff" />
        </Appbar.Header>

        <Animated.View
          style={[
            styles.welcomeCard,
            { transform:[{ translateY: avatarTranslateY }, { scale: avatarScale }] },
          ]}
        >
          <Avatar.Icon size={72} icon="shield-account" style={styles.avatar} color="#fff" />
          <View style={styles.welcomeText}>
            <Title style={styles.welcomeTitle}>Welcome Admin</Title>
            <Text  style={styles.welcomeSubtitle}>
              Last login: Today at {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* MAIN CONTENT */}
      <Animated.View style={{ flex:1, opacity: fadeAnim }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent:{ contentOffset:{ y: scrollY } } }],
            { useNativeDriver:false }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.spacer} />

          {features.map((section, index)=>(
            <View key={index} style={styles.cardContainer}>
              <Card style={[styles.card, styles.sectionCard]} elevation={3}>
                <Card.Title
                  title={section.title}
                  titleStyle={styles.sectionTitle}
                  subtitle={`${section.buttons.length} actions available`}
                  subtitleStyle={styles.sectionSubtitle}
                  left={()=>(
                    <View style={styles.sectionIconContainer}>
                      <Icon name={index===0?'bookmark-multiple-outline':'account-group'} size={24} color="#fff" />
                    </View>
                  )}
                />
                <Card.Content style={styles.cardContent}>
                  <View style={styles.buttonGroup}>
                    {section.buttons.map((b,i)=>(
                      <TouchableRipple key={i}
                        onPress={b.action}
                        style={[styles.featureButton, {backgroundColor:b.color}]}
                        rippleColor="rgba(255,255,255,0.2)"
                      >
                        <View style={styles.featureButtonContent}>
                          <View style={styles.featureIconContainer}>
                            <Icon name={b.icon} size={28} color="#fff" />
                            {b.count && <Badge style={styles.badge}>{b.count}</Badge>}
                          </View>
                          <Text style={styles.featureLabel}>{b.label}</Text>
                        </View>
                      </TouchableRipple>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            </View>
          ))}

          {/* QUICK ACTIONS */}
          <Card style={[styles.card, styles.quickActionsCard]} elevation={3}>
            <Card.Title
              title="Quick Actions" titleStyle={styles.sectionTitle}
              subtitle="Frequently used actions" subtitleStyle={styles.sectionSubtitle}
              left={()=>(
                <View style={[styles.sectionIconContainer, {backgroundColor:'#ffc107'}]}>
                  <Icon name="lightning-bolt" size={24} color="#fff" />
                </View>
              )}
            />
            <Card.Content>
              <View style={styles.quickActions}>
                <Button
                  mode="contained-tonal"
                  style={[styles.quickActionButton,{backgroundColor:'#f3e5ff'}]}
                  icon="book-plus" textColor="#7c4dff"
                  contentStyle={styles.quickActionContent}
                  onPress={()=>navigation.navigate('TextbookManagement')}
                >Add Textbook</Button>

                <Button
                  mode="contained-tonal"
                  style={[styles.quickActionButton,{backgroundColor:'#e0f7fa'}]}
                  icon="file-plus"  textColor="#00bcd4"
                  contentStyle={styles.quickActionContent}
                  onPress={()=>navigation.navigate('TestManagement')}
                >Create Test</Button>

                <Button
                  mode="contained-tonal"
                  style={[styles.quickActionButton,{backgroundColor:'#fff3e0'}]}
                  icon="account-plus" textColor="#ff9800"
                  contentStyle={styles.quickActionContent}
                  onPress={()=>navigation.navigate('UserManagement')}
                >Add User</Button>
              </View>
            </Card.Content>
          </Card>

          {/* STATISTICS */}
          <Card style={[styles.card, styles.statsCard]} elevation={2}>
            <Card.Title
              title="Platform Statistics" titleStyle={styles.sectionTitle}
              left={()=>(
                <View style={[styles.sectionIconContainer,{backgroundColor:'#4caf50'}]}>
                  <Icon name="chart-bar" size={24} color="#fff" />
                </View>
              )}
            />
            <Card.Content>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>1,256</Text>
                  <Text style={styles.statLabel}>Active Users</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>328</Text>
                  <Text style={styles.statLabel}>Textbooks</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>1.2K</Text>
                  <Text style={styles.statLabel}>Tests Taken</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

/* ───────────────────────────── TABS (inside dark provider) ───────────────────────────── */
const AdminTabs = () => (
  <Tab.Navigator
    initialRouteName="Dashboard"
    activeColor="#fff"
    inactiveColor="rgba(255,255,255,0.7)"
    barStyle={{ backgroundColor: AdminPalette.primary, height: 70, borderTopWidth: 0 }}
    shifting
    sceneAnimationEnabled
  >
    <Tab.Screen name="Dashboard"          component={AdminDashboard}
      options={{ tabBarIcon:({color})=><Icon name="view-dashboard-outline" color={color} size={26}/> }}/>
    <Tab.Screen name="TextbookManagement" component={TextbookManagementScreen}
      options={{ tabBarIcon:({color})=><Icon name="book-open-outline" color={color} size={26}/> }}/>
    <Tab.Screen name="TestManagement"     component={TestManagementScreen}
      options={{ tabBarIcon:({color})=><Icon name="file-document-multiple-outline" color={color} size={26}/> }}/>
    <Tab.Screen name="UserManagement"     component={UserManagementScreen}
      options={{ tabBarIcon:({color})=><Icon name="account-group-outline" color={color} size={26}/> }}/>
  </Tab.Navigator>
);

/* ───────────────────────────── WRAPPER ───────────────────────────── */
const AdminPanel = () => (
  <AdminOnly>
    {/* override the global light theme with the dark admin theme */}
    <PaperProvider theme={AdminDarkTheme}>
      <AdminTabs />
    </PaperProvider>
  </AdminOnly>
);

/* ───────────────────────────── STYLES ───────────────────────────── */
const makeStyles = (c) => StyleSheet.create({
  screenWrapper: { flex:1, backgroundColor:c.background, position:'relative' },

  /* purple translucent blobs */
  circle1:{
    position:'absolute', width:300, height:300, borderRadius:150,
    backgroundColor:AdminPalette.primaryXLight, top:-100, left:-100,
  },
  circle2:{
    position:'absolute', width:400, height:400, borderRadius:200,
    backgroundColor:AdminPalette.primaryXXLight, bottom:-150, right:-100,
  },

  headerContainer:{
    backgroundColor:c.primary,
    overflow:'hidden',
    shadowColor:AdminPalette.shadow, shadowOffset:{width:0,height:4},
    shadowOpacity:0.6, shadowRadius:6, elevation:8, zIndex:10,
  },
  header:{ backgroundColor:'transparent', elevation:0, shadowOpacity:0, marginTop:10 },
  headerTitle:{ color:'#fff', fontSize:22, fontWeight:'600' },

  welcomeCard:{ flexDirection:'row', alignItems:'center',
    paddingHorizontal:24, paddingVertical:16, marginTop:10, backgroundColor:c.primary },
  avatar:{ backgroundColor:AdminPalette.primaryLight, marginRight:20, borderWidth:2, borderColor:AdminPalette.primaryLight },
  welcomeTitle:{ color:'#fff', fontSize:22, fontWeight:'600' },
  welcomeSubtitle:{ color:'rgba(255,255,255,0.8)', fontSize:14 },

  container:{ flex:1 },
  content:{ paddingHorizontal:16, paddingBottom:24 },
  spacer:{ height:100 },

  cardContainer:{ marginBottom:20 },
  card:{ borderRadius:12, overflow:'hidden' },
  sectionCard:{ backgroundColor:c.surface },

  sectionTitle:{ fontSize:18, fontWeight:'600', color:c.onSurface },
  sectionSubtitle:{ fontSize:13, color:AdminPalette.textMuted },

  sectionIconContainer:{
    backgroundColor:c.primary, width:40, height:40, borderRadius:20,
    justifyContent:'center', alignItems:'center', marginRight:12,
  },
  cardContent:{ padding:8 },

  /* feature buttons */
  buttonGroup:{ flexDirection:'row', justifyContent:'space-between', flexWrap:'wrap' },
  featureButton:{ width:'48%', borderRadius:10, paddingVertical:20, marginVertical:6, elevation:2 },
  featureButtonContent:{ alignItems:'center' },
  featureIconContainer:{ position:'relative', marginBottom:8 },
  featureLabel:{ color:'#fff', fontSize:14, fontWeight:'500', textAlign:'center' },
  badge:{ position:'absolute', top:-8, right:-8, backgroundColor:c.error, fontSize:12 },

  /* quick actions */
  quickActionsCard:{ marginTop:8 },
  quickActions:{ flexDirection:'row', justifyContent:'space-between', flexWrap:'wrap' },
  quickActionButton:{ width:'31%', borderRadius:8, paddingVertical:8, marginVertical:4 },
  quickActionContent:{ paddingVertical:6 },

  /* stats */
  statsCard:{ marginTop:8 },
  statsContainer:{ flexDirection:'row', justifyContent:'space-between', paddingVertical:12 },
  statItem:{ alignItems:'center', paddingHorizontal:8 },
  statValue:{ fontSize:20, fontWeight:'700', color:c.primary, marginBottom:4 },
  statLabel:{ fontSize:12, color:AdminPalette.textMuted },
});

export default AdminPanel;