import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Title, HelperText, Button } from 'react-native-paper';

/**
 * PdfCard Component
 * Renders a card displaying PDF details with Edit and Delete actions.
 *
 * Props:
 * - pdf: Object with keys { id, title, board, classLevel, subject, pdfUrl }
 * - onEdit: Function called when Edit is pressed.
 * - onDelete: Function called when Delete is pressed.
 */
const PdfCard = ({ pdf, onEdit, onDelete }) => {
  return (
    <TouchableOpacity style={styles.wrapper} activeOpacity={0.8}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{pdf.title}</Title>
          <HelperText type="info">{`${pdf.board} | ${pdf.classLevel} | ${pdf.subject}`}</HelperText>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button mode="outlined" onPress={() => onEdit(pdf)} accessibilityLabel={`Edit ${pdf.title}`}>
            Edit
          </Button>
          <Button mode="outlined" onPress={() => onDelete(pdf.id)} accessibilityLabel={`Delete ${pdf.title}`}>
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

export default PdfCard;
 
