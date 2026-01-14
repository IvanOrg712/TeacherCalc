import React from 'react';
import Modal from '../../common/Modal/Modal';
import './ErrorOverlay.css';

interface ErrorOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ isOpen, onClose, message }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Error">
            <div className="error-content">
                <p>{message}</p>
                <button className="create-btn error-btn" onClick={onClose}>
                    Entendido
                </button>
            </div>
        </Modal>
    );
};

export default ErrorOverlay;
