 
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Title, HelperText, Button } from 'react-native-paper';

/**
 * NoteCard Component
 * Renders a note preview with Edit and Delete buttons.
 *
 * Props:
 * - note: An object with keys { id, title, description, subject }
 * - onEdit: Callback when Edit is pressed.
 * - onDelete: Callback when Delete is pressed.
 */
const NoteCard = ({ note, onEdit, onDelete }) => {
  return (
    <TouchableOpacity style={styles.wrapper} activeOpacity={0.8}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{note.title}</Title>
          <HelperText type="info">{note.subject}</HelperText>
          <HelperText type="info">{note.description}</HelperText>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button mode="outlined" onPress={() => onEdit(note)} accessibilityLabel={`Edit note ${note.title}`}>
            Edit
          </Button>
          <Button mode="outlined" onPress={() => onDelete(note.id)} accessibilityLabel={`Delete note ${note.title}`}>
            Delete
          </Button>
        </Card.Actions>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  card: {
    borderRadius: 10,
    elevation: 4,
    backgroundColor: '#fff',
  },
  actions: {
    justifyContent: 'flex-end',
  },
});

export default NoteCard;
