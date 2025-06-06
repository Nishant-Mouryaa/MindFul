import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Dimensions, StatusBar } from 'react-native';
import { 
  Appbar, 
  Searchbar, 
  Button, 
  Modal, 
  Portal, 
  Text, 
  Avatar, 
  Chip,
  ActivityIndicator,
  Title,
  IconButton,
  Badge,
  Card
} from 'react-native-paper';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      
      const userData = [];
      snapshot.forEach(doc => {
        userData.push({ id: doc.id, ...doc.data() });
      });
      
      setUsers(userData);
    } catch (err) {
      console.error("Error loading users:", err);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await auth.deleteUser(selectedUser.uid);
      await deleteDoc(doc(db, 'users', selectedUser.id));
      
      Alert.alert("Success", "User deleted successfully");
      loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      Alert.alert("Error", "Failed to delete user");
    } finally {
      setConfirmDeleteVisible(false);
      setSelectedUser(null);
    }
  };

  const toggleAdminStatus = async (user) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isAdmin: !user.isAdmin
      });
      Alert.alert("Success", `User ${!user.isAdmin ? 'promoted to' : 'demoted from'} admin`);
      loadUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      Alert.alert("Error", "Failed to update user");
    }
  };

  const getAvatarColor = (user) => {
    if (user.isAdmin) return '#3B2454';
    if (user.displayName) {
      // Generate a color based on the first letter of displayName
      const colors = ['#7c4dff', '#00bcd4', '#ff9800', '#4caf50', '#f44336'];
      const charCode = user.displayName.charCodeAt(0);
      return colors[charCode % colors.length];
    }
    return '#03dac6';
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3B2454" barStyle="light-content" />
      
      <LinearGradient
        colors={['#3B2454', '#5D3A8E']}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
          <Appbar.Content 
            title="User Management" 
            titleStyle={styles.headerTitle} 
          />
        </Appbar.Header>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search users..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor="#7c4dff"
            placeholderTextColor="#9e9e9e"
            elevation={1}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7c4dff" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={styles.userCard}>
                <Card.Content>
                  <View style={styles.userInfo}>
                    <Avatar.Text 
                      size={48} 
                      label={item.displayName ? item.displayName.charAt(0).toUpperCase() : item.email.charAt(0).toUpperCase()} 
                      style={[styles.avatar, { backgroundColor: getAvatarColor(item) }]}
                      labelStyle={styles.avatarText}
                    />
                    <View style={styles.userDetails}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {item.displayName || 'No name'}
                      </Text>
                      <Text style={styles.userEmail} numberOfLines={1}>
                        {item.email}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.actions}>
                    {item.isAdmin && (
                      <Badge style={styles.adminBadge}>Admin</Badge>
                    )}
                    <Button 
                      mode="contained-tonal"
                      onPress={() => toggleAdminStatus(item)}
                      style={styles.adminButton}
                      labelStyle={styles.adminButtonText}
                      compact
                    >
                      {item.isAdmin ? 'Demote' : 'Promote'}
                    </Button>
                    <IconButton 
                      icon="delete-outline" 
                      mode="text"
                      onPress={() => {
                        setSelectedUser(item);
                        setConfirmDeleteVisible(true);
                      }}
                      iconColor="#ff5252"
                      size={20}
                      style={styles.deleteButton}
                    />
                  </View>
                </Card.Content>
              </Card>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="account-alert-outline" size={48} color="#9e9e9e" />
                <Title style={styles.emptyTitle}>No Users Found</Title>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try a different search' : 'No users registered yet'}
                </Text>
              </View>
            }
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <Portal>
        <Modal 
          visible={confirmDeleteVisible} 
          onDismiss={() => setConfirmDeleteVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Avatar.Icon 
              icon="alert-outline" 
              size={64} 
              style={styles.modalIcon} 
              color="#ff5252"
            />
            <Title style={styles.modalTitle}>
              Confirm Deletion
            </Title>
            <Text style={styles.modalText}>
              Are you sure you want to permanently delete {selectedUser?.displayName || selectedUser?.email}?
            </Text>
            <Text style={styles.modalWarning}>
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setConfirmDeleteVisible(false)}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonLabel}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleDeleteUser}
                style={styles.deleteButtonModal}
                labelStyle={styles.deleteButtonLabel}
              >
                Delete
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  headerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    marginTop: StatusBar.currentHeight,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 1,
  },
  searchInput: {
    color: '#2d3436',
    minHeight: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#636e72',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#2d3436',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#636e72',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B2454',
    marginRight: 8,
  },
  adminButton: {
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
  },
  adminButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    margin: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#636e72',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    margin: 24,
    alignSelf: 'center',
    width: width - 48,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    backgroundColor: '#ffebee',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#2d3436',
  },
  modalText: {
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 24,
    color: '#555',
  },
  modalWarning: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#ff5252',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 0.48,
    borderRadius: 12,
    borderColor: '#b2bec3',
  },
  cancelButtonLabel: {
    color: '#636e72',
    fontWeight: '500',
  },
  deleteButtonModal: {
    flex: 0.48,
    borderRadius: 12,
    backgroundColor: '#ff5252',
  },
  deleteButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default UserManagementScreen;