import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const AboutUsScreen = () => {
  const openLink = async (url) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  const handleContact = (type, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (type) {
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${value}`);
        break;
      case 'website':
        Linking.openURL(`https://${value}`);
        break;
      case 'address':
        // For address, you might want to open maps
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`);
        break;
    }
  };

  return (
    <LinearGradient
      colors={['#6C63FF', '#8B85FF']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Hero Section with Full Background Logo */}
        <View style={styles.heroContainer}>
          <Image 
            source={require('../assets/institute-logo.jpg')} 
            style={styles.backgroundLogo}
            blurRadius={2}
            resizeMode='contain'
          />
          <View style={styles.heroContent}>
            <Image 
              source={require('../assets/institute-logo.jpg')} 
              style={styles.logo}
            resizeMode='contain'
            width={width * 0.5} // 50% of screen width
            height={width * 0.5} // 50% of screen width

            />
            <Text style={styles.header}>ExcelEd Academy</Text>
            <Text style={styles.subHeader}>Transforming Education Since 2010</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <FontAwesome5 name="chalkboard-teacher" size={32} color="#6C63FF" />
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Expert Tutors</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="school" size={32} color="#6C63FF" />
            <Text style={styles.statNumber}>2000+</Text>
            <Text style={styles.statLabel}>Students Taught</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="trophy" size={32} color="#6C63FF" />
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Mission Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="bullseye-arrow" size={28} color="#6C63FF" />
              <Text style={styles.sectionTitle}>Our Mission</Text>
            </View>
            <Text style={styles.sectionText}>
              At ExcelEd Academy, we're committed to providing personalized, high-quality tuition that empowers 
              students to achieve academic excellence. We combine traditional teaching values with innovative 
              methodologies to create a learning environment where every student can thrive.
            </Text>
          </View>

          {/* Methodology Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="brain" size={28} color="#6C63FF" />
              <Text style={styles.sectionTitle}>Our Teaching Methodology</Text>
            </View>
            <View style={styles.methodologyItem}>
              <View style={styles.methodologyIcon}>
                <MaterialCommunityIcons name="account-group" size={20} color="#fff" />
              </View>
              <Text style={styles.methodologyText}>Small class sizes (max 8 students) for personalized attention</Text>
            </View>
            <View style={styles.methodologyItem}>
              <View style={styles.methodologyIcon}>
                <MaterialCommunityIcons name="chart-line" size={20} color="#fff" />
              </View>
              <Text style={styles.methodologyText}>Regular progress tracking and feedback sessions</Text>
            </View>
            <View style={styles.methodologyItem}>
              <View style={styles.methodologyIcon}>
                <MaterialCommunityIcons name="lightbulb-on" size={20} color="#fff" />
              </View>
              <Text style={styles.methodologyText}>Concept-focused learning rather than rote memorization</Text>
            </View>
          </View>

          {/* History Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="history" size={28} color="#6C63FF" />
              <Text style={styles.sectionTitle}>Our Journey</Text>
            </View>
            <Text style={styles.sectionText}>
              Founded in 2010 by Dr. Priya Sharma (PhD in Education), ExcelEd started as a small tuition center 
              with just 3 teachers and 20 students. Today, we operate 5 centers across the city and have expanded 
              to offer online classes, serving students from grade 5 through university entrance exams.
            </Text>
            <View style={styles.achievementContainer}>
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementYear}>2010</Text>
                <Text style={styles.achievementText}>Founded</Text>
              </View>
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementYear}>2015</Text>
                <Text style={styles.achievementText}>First Expansion</Text>
              </View>
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementYear}>2020</Text>
                <Text style={styles.achievementText}>Digital Platform Launched</Text>
              </View>
            </View>
          </View>

          {/* Team Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-tie" size={28} color="#6C63FF" />
              <Text style={styles.sectionTitle}>Our Faculty</Text>
            </View>
            <Text style={styles.sectionText}>
              Our team comprises experienced educators with advanced degrees in their respective fields, 
              many of whom are former university professors or examiners. We invest heavily in continuous 
              teacher training to ensure our methodologies remain cutting-edge.
            </Text>
            <View style={styles.teamContainer}>
              <View style={styles.teamMember}>
                <Image 
                  source={require('../assets/teacher1.png')} 
                  style={styles.teamImage}
                />
                <Text style={styles.teamName}>Dr. Priya Sharma</Text>
                <Text style={styles.teamRole}>Founder & Director</Text>
              </View>
              <View style={styles.teamMember}>
                <Image 
                  source={require('../assets/teacher2.png')} 
                  style={styles.teamImage}
                />
                <Text style={styles.teamName}>Prof. Ramesh Patel</Text>
                <Text style={styles.teamRole}>Head of Science</Text>
              </View>
            </View>
          </View>

          {/* Testimonials */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="format-quote-close" size={28} color="#6C63FF" />
              <Text style={styles.sectionTitle}>Success Stories</Text>
            </View>
            <View style={styles.testimonialCard}>
              <MaterialCommunityIcons name="format-quote-open" size={24} color="#6C63FF" style={styles.quoteIcon} />
              <Text style={styles.testimonialText}>
                ExcelEd helped me improve my Physics grade from a C to an A* in just 6 months. The teachers 
                explain concepts so clearly and the regular tests built my confidence for the actual exams.
              </Text>
              <Text style={styles.testimonialAuthor}>- Rahul Mehta (IIT-JEE Rank 142)</Text>
            </View>
          </View>

          {/* Contact Section */}
          <View style={[styles.section, styles.contactSection]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="email" size={28} color="#6C63FF" />
              <Text style={styles.sectionTitle}>Get In Touch</Text>
            </View>
            <TouchableOpacity 
              style={styles.contactItem} 
              onPress={() => handleContact('email', 'info@exceled.com')}
            >
              <MaterialCommunityIcons name="email" size={24} color="#6C63FF" />
              <Text style={styles.contactText}>info@exceled.com</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactItem} 
              onPress={() => handleContact('phone', '+919876543210')}
            >
              <MaterialCommunityIcons name="phone" size={24} color="#6C63FF" />
              <Text style={styles.contactText}>+91 98765 43210</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactItem} 
              onPress={() => handleContact('website', 'www.exceled.com')}
            >
              <MaterialCommunityIcons name="web" size={24} color="#6C63FF" />
              <Text style={styles.contactText}>www.exceled.com</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactItem} 
              onPress={() => handleContact('address', 'ExcelEd Academy, EduTech Park, Mumbai')}
            >
              <MaterialCommunityIcons name="map-marker" size={24} color="#6C63FF" />
              <Text style={styles.contactText}>EduTech Park, Mumbai</Text>
            </TouchableOpacity>
            
            {/* Social Media */}
            <View style={styles.socialContainer}>
              <TouchableOpacity onPress={() => openLink('https://facebook.com/exceled')}>
                <FontAwesome5 name="facebook" size={24} color="#6C63FF" style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink('https://instagram.com/exceled')}>
                <FontAwesome5 name="instagram" size={24} color="#6C63FF" style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink('https://youtube.com/exceled')}>
                <FontAwesome5 name="youtube" size={24} color="#6C63FF" style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink('https://linkedin.com/company/exceled')}>
                <FontAwesome5 name="linkedin" size={24} color="#6C63FF" style={styles.socialIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContainer: {
      paddingBottom: 40,
    },
    heroContainer: {
      height: height * 0.4, // 40% of screen height
      width: '100%',
      position: 'relative',
      marginBottom: 20,
    },
    backgroundLogo: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      opacity: 0.2,
      resizeMode: 'cover',
    },
    heroContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: 'rgba(108, 99, 255, 0.5)', // semi-transparent overlay
    },
    logo: {
       width: '100%', // or specific width like 200
  height: 120, // adjust as needed
 
      borderRadius: 60,
      borderWidth: 3,
      borderColor: '#fff',
      marginBottom: 20,
    },
    header: {
      fontSize: 32,
      fontWeight: '800',
      color: '#fff',
      marginBottom: 8,
      fontFamily: 'Roboto_700Bold',
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    subHeader: {
      fontSize: 18,
      color: '#fff',
      fontFamily: 'Roboto_400Regular',
      opacity: 0.9,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6C63FF',
    marginVertical: 5,
    fontFamily: 'Roboto_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    fontFamily: 'Roboto_500Medium',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
    marginLeft: 10,
    fontFamily: 'Roboto_700Bold',
  },
  sectionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontFamily: 'Roboto_400Regular',
    marginBottom: 15,
  },
  methodologyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodologyIcon: {
    backgroundColor: '#6C63FF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  methodologyText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    fontFamily: 'Roboto_400Regular',
  },
  achievementContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  achievementBadge: {
    backgroundColor: '#f0f0ff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
  },
  achievementYear: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C63FF',
    fontFamily: 'Roboto_700Bold',
  },
  achievementText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
    fontFamily: 'Roboto_500Medium',
  },
  teamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  teamMember: {
    alignItems: 'center',
    width: '48%',
  },
  teamImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#6C63FF',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    fontFamily: 'Roboto_600SemiBold',
    textAlign: 'center',
  },
  teamRole: {
    fontSize: 14,
    color: '#6C63FF',
    fontFamily: 'Roboto_500Medium',
    textAlign: 'center',
  },
  testimonialCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#6C63FF',
  },
  quoteIcon: {
    marginBottom: 10,
  },
  testimonialText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
    lineHeight: 24,
    marginBottom: 10,
    fontFamily: 'Roboto_400Regular',
  },
  testimonialAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
    fontFamily: 'Roboto_600SemiBold',
    textAlign: 'right',
  },
  contactSection: {
    marginBottom: 0,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontFamily: 'Roboto_500Medium',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  socialIcon: {
    marginHorizontal: 15,
  },
});

export default AboutUsScreen;