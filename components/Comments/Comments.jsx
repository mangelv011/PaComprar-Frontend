'use client';

import React, { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText,
  Divider,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CommentIcon from '@mui/icons-material/Comment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import styles from './styles.module.css';
import { API_ROUTES } from '../../config/apiConfig';

const CommentSection = ({ auctionId, currentUser, authFetch, comments = [], isLoading, onCommentAdded }) => {
  const [newComment, setNewComment] = useState({ titulo: '', texto: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editedComment, setEditedComment] = useState({ titulo: '', texto: '' });
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleInputChange = (field, value) => {
    setNewComment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditChange = (field, value) => {
    setEditedComment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Debes iniciar sesión para comentar');
      return;
    }

    if (!newComment.titulo.trim() || !newComment.texto.trim()) {
      alert('El título y el contenido del comentario son obligatorios');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await authFetch(API_ROUTES.AUCTION_COMMENTS(auctionId), {
        method: "POST", 
        body: JSON.stringify({
          titulo: newComment.titulo,
          texto: newComment.texto,
        })
      });
      
      console.log('Comentario enviado:', response);
      
      if (response && response.id) {
        if (onCommentAdded) {
          onCommentAdded(response);
        }
        setNewComment({ titulo: '', texto: '' });
      }
    } catch (err) {
      console.error('Error al enviar el comentario:', err);
      setError('No se pudo enviar el comentario. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment);
    setEditedComment({
      titulo: comment.titulo,
      texto: comment.texto,
    });
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditedComment({ titulo: '', texto: '' });
  };

  const saveEditedComment = async () => {
    if (!editingComment || !currentUser) return;

    try {
      setIsSavingEdit(true);
      setError(null);
      
      const response = await authFetch(API_ROUTES.COMMENT_BY_ID(auctionId, editingComment.id), {
        method: "PUT", 
        body: JSON.stringify({
          titulo: editedComment.titulo,
          texto: editedComment.texto,
        })
      });
      
      console.log('Comentario actualizado:', response);
      
      if (onCommentAdded) {
        const updatedComments = comments.map(c => 
          c.id === editingComment.id 
            ? { ...c, titulo: editedComment.titulo, texto: editedComment.texto } 
            : c
        );
        onCommentAdded(null, updatedComments);
      }

      setEditingComment(null);
      setEditedComment({ titulo: '', texto: '' });
    } catch (err) {
      console.error('Error al actualizar el comentario:', err);
      setError('No se pudo actualizar el comentario. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = (commentId) => {
    setDeletingCommentId(commentId);
  };

  const cancelDelete = () => {
    setDeletingCommentId(null);
  };

  const deleteComment = async () => {
    if (!deletingCommentId || !currentUser) return;

    try {
      setIsDeleting(true);
      setError(null);
      
      await authFetch(API_ROUTES.COMMENT_BY_ID(auctionId, deletingCommentId), {
        method: "DELETE"
      });
      
      console.log('Comentario eliminado con ID:', deletingCommentId);
      
      if (onCommentAdded) {
        const filteredComments = comments.filter(c => c.id !== deletingCommentId);
        onCommentAdded(null, filteredComments);
      }
      
      setDeletingCommentId(null);
    } catch (err) {
      console.error('Error al eliminar el comentario:', err);
      setError('No se pudo eliminar el comentario. Por favor, inténtelo de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCommentOwner = (comment) => {
    return currentUser && comment.usuario === currentUser.id;
  };

  return (
    <Card className={styles.commentSectionCard}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <CommentIcon sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6" className={styles.sectionTitle}>
            Comentarios
          </Typography>
        </Box>
        
        {error && (
          <Box className={styles.errorAlert} mb={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {currentUser ? (
          <Paper elevation={0} className={styles.commentForm}>
            <form onSubmit={handleSubmitComment}>
              <TextField 
                fullWidth
                variant="outlined"
                label="Título"
                placeholder="Añade un título a tu comentario"
                value={newComment.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                disabled={isSubmitting}
                className={styles.titleInput}
                margin="normal"
                size="small"
                required
              />
              <TextField 
                fullWidth
                variant="outlined"
                label="Comentario"
                placeholder="Escribe tu comentario..."
                value={newComment.texto}
                onChange={(e) => handleInputChange('texto', e.target.value)}
                disabled={isSubmitting}
                multiline
                rows={3}
                className={styles.commentInput}
                margin="normal"
                required
              />
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  type="submit"
                  startIcon={<SendIcon />}
                  disabled={isSubmitting || !newComment.titulo.trim() || !newComment.texto.trim()}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar comentario'}
                </Button>
              </Box>
            </form>
          </Paper>
        ) : (
          <Paper elevation={0} className={styles.loginPromptContainer}>
            <Typography variant="body2" color="textSecondary" align="center">
              <a href="/login" className={styles.loginLink}>Inicia sesión</a> para dejar un comentario
            </Typography>
          </Paper>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress size={30} />
          </Box>
        ) : comments.length === 0 ? (
          <Box className={styles.emptyCommentsContainer}>
            <Typography variant="body1" color="textSecondary" align="center">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </Typography>
          </Box>
        ) : (
          <List className={styles.commentList}>
            {comments.map((comment) => (
              <Box key={comment.id} mb={2}>
                <Paper elevation={1} className={styles.commentItem}>
                  {editingComment && editingComment.id === comment.id ? (
                    <Box p={2}>
                      <TextField 
                        fullWidth
                        variant="outlined"
                        label="Título"
                        value={editedComment.titulo}
                        onChange={(e) => handleEditChange('titulo', e.target.value)}
                        className={styles.titleInput}
                        margin="normal"
                        size="small"
                        required
                        disabled={isSavingEdit}
                      />
                      <TextField 
                        fullWidth
                        variant="outlined"
                        label="Comentario"
                        value={editedComment.texto}
                        onChange={(e) => handleEditChange('texto', e.target.value)}
                        multiline
                        rows={3}
                        className={styles.commentInput}
                        margin="normal"
                        required
                        disabled={isSavingEdit}
                      />
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Button 
                          onClick={cancelEditing}
                          startIcon={<CancelIcon />}
                          color="inherit"
                          sx={{ mr: 1 }}
                          disabled={isSavingEdit}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={saveEditedComment}
                          variant="contained" 
                          color="primary"
                          startIcon={<SaveIcon />}
                          disabled={isSavingEdit || !editedComment.titulo.trim() || !editedComment.texto.trim()}
                        >
                          {isSavingEdit ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <ListItem alignItems="flex-start" className={styles.commentListItem}>
                      <ListItemAvatar>
                        <Avatar className={styles.userAvatar}>
                          {comment.usuario_nombre?.charAt(0).toUpperCase() || '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" className={styles.commentTitle}>
                              {comment.titulo}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatDateTime(comment.fecha_creacion)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" className={styles.commentText} gutterBottom>
                              {comment.texto}
                            </Typography>
                            <Typography variant="caption" className={styles.userName}>
                              Por: {comment.usuario_nombre || 'Usuario anónimo'}
                            </Typography>
                          </>
                        }
                      />
                      {isCommentOwner(comment) && (
                        <Box className={styles.commentActions}>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => startEditing(comment)}
                            title="Editar comentario"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => confirmDelete(comment.id)}
                            title="Eliminar comentario"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </ListItem>
                  )}
                </Paper>
              </Box>
            ))}
          </List>
        )}
        
        {isLoading && comments.length > 0 && (
          <Box display="flex" justifyContent="center" mt={1} mb={1}>
            <CircularProgress size={20} />
          </Box>
        )}

        <Dialog
          open={Boolean(deletingCommentId)}
          onClose={cancelDelete}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              ¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete} color="primary" disabled={isDeleting}>
              Cancelar
            </Button>
            <Button onClick={deleteComment} color="error" disabled={isDeleting} autoFocus>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CommentSection;