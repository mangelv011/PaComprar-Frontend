import * as React from 'react';
import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';
import styles from './styles.module.css';

const StarRating = ({ value, readOnly = true, onChange, showValue = true, precision = 1 }) => {
  return (
    <Box className={styles.ratingContainer}>
      <Rating
        name="product-rating"
        value={value || 0}
        precision={precision}
        readOnly={readOnly}
        onChange={onChange}
      />
      {showValue && value !== null && value !== undefined && (
        <span className={styles.ratingValue}>
          ({parseFloat(value).toFixed(1)})
        </span>
      )}
    </Box>
  );
};

export default StarRating;