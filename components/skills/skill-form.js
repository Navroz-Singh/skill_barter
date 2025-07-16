// components/skills/skill-form.js
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function SkillForm({ onSuccess }) {
    const { user } = useUser();
    const fileInputRef = useRef(null);
    
    const initialFormState = {
        title: '',
        description: '',
        category: '',
        level: 'Beginner',
        tags: '',
        location: '',
        deliveryMethod: 'Both',
        estimatedDuration: ''
    };

    const [formData, setFormData] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('skillDraft');
            if (saved) {
                try {
                    return { ...initialFormState, ...JSON.parse(saved) };
                } catch {
                    // ignore parse error and fallthrough to default
                }
            }
        }
        return initialFormState;
    });

    // Image upload states
    const [images, setImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Save form data to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('skillDraft', JSON.stringify(formData));
        }
    }, [formData]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Validate file type and size
    const validateFile = (file) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            return 'Please select a valid image file (JPG, PNG, GIF, WebP)';
        }

        if (file.size > maxSize) {
            return 'File size must be less than 5MB';
        }

        return null;
    };

    // Upload to Cloudinary
    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return {
                url: data.secure_url,
                publicId: data.public_id,
                alt: file.name
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new Error('Failed to upload image');
        }
    };

    // Handle file upload
    const handleFileUpload = useCallback(async (files) => {
        if (images.length >= 3) {
            setUploadError('Maximum 3 images allowed');
            return;
        }

        setIsUploading(true);
        setUploadError('');

        try {
            const fileArray = Array.from(files);
            const remainingSlots = 3 - images.length;
            const filesToUpload = fileArray.slice(0, remainingSlots);

            for (const file of filesToUpload) {
                const validationError = validateFile(file);
                if (validationError) {
                    setUploadError(validationError);
                    setIsUploading(false);
                    return;
                }

                const uploadedImage = await uploadToCloudinary(file);
                setImages(prev => [...prev, uploadedImage]);
            }

            if (fileArray.length > remainingSlots) {
                setUploadError(`Only ${remainingSlots} more image(s) allowed`);
            }
        } catch (error) {
            setUploadError(error.message);
        } finally {
            setIsUploading(false);
        }
    }, [images.length]);

    // Handle file input change
    const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files);
        }
    };

    // Handle drag and drop
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    }, [handleFileUpload]);

    // Remove image
    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setUploadError('');
    };

    // Submit skill to backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            setError('Please log in to submit a skill');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Convert tags string to array and prepare data
            const skillData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                images: images // Include uploaded images
            };

            const response = await fetch('/api/skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(skillData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit skill');
            }

            // Reset form on success
            setFormData(initialFormState);
            setImages([]);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('skillDraft');
            }

            // Call success callback if provided
            if (onSuccess) {
                onSuccess(result.skill);
            }

        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Share Your Skill
            </h2>

            {error && (
                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Skill Images (Optional)
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Upload up to 3 images. The first image will be used as thumbnail in skill browsing.
                    </p>

                    {/* Upload Error */}
                    {uploadError && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {uploadError}
                        </div>
                    )}

                    {/* Drag & Drop Area */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                            dragActive
                                ? 'border-[var(--parrot)] bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-300 dark:border-gray-600'
                        } ${images.length >= 3 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => images.length < 3 && fileInputRef.current?.click()}
                    >
                        <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {images.length >= 3 ? 'Maximum images reached' : 'Drag and drop images here'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {images.length >= 3 ? 'Remove an image to upload more' : 'or click to browse files'}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <ImageIcon className="w-4 h-4" />
                            <span>PNG, JPG, GIF, WebP up to 5MB each</span>
                        </div>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                        disabled={images.length >= 3}
                    />

                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-blue-700 dark:text-blue-300">Uploading images...</span>
                            </div>
                        </div>
                    )}

                    {/* Image Preview */}
                    {images.length > 0 && (
                        <div className="mt-4 space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Uploaded images ({images.length}/3):
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {images.map((image, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={image.alt}
                                            className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                        />
                                        {index === 0 && (
                                            <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                                Thumbnail
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Skill Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Skill Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        maxLength={100}
                        placeholder="e.g., Web Development, Guitar Playing"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {formData.title.length}/100 characters
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={4}
                        maxLength={1000}
                        placeholder="Describe your skill, what you can teach, and your experience..."
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {formData.description.length}/1000 characters
                    </p>
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-200"
                    >
                        <option value="">Select a category</option>
                        <option value="Technology">Technology</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                        <option value="Language">Language</option>
                        <option value="Photography">Photography</option>
                        <option value="Music">Music</option>
                        <option value="Handcraft">Handcraft</option>
                        <option value="Education">Education</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Skill Level */}
                <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Level *
                    </label>
                    <select
                        id="level"
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-200"
                    >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                    </select>
                </div>

                {/* Location */}
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., New York, Online, Mumbai"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    />
                </div>

                {/* Delivery Method */}
                <div>
                    <label htmlFor="deliveryMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Delivery Method
                    </label>
                    <select
                        id="deliveryMethod"
                        name="deliveryMethod"
                        value={formData.deliveryMethod}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-200"
                    >
                        <option value="In-person">In-person</option>
                        <option value="Online">Online</option>
                        <option value="Both">Both</option>
                    </select>
                </div>

                {/* Estimated Duration */}
                <div>
                    <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estimated Duration
                    </label>
                    <input
                        type="text"
                        id="estimatedDuration"
                        name="estimatedDuration"
                        value={formData.estimatedDuration}
                        onChange={handleChange}
                        placeholder="e.g., 2 hours, 1 week, 3 sessions"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags (comma-separated)
                    </label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="e.g., React, JavaScript, Frontend"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--parrot)] focus:border-[var(--parrot)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Separate tags with commas. Each tag max 30 characters.
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--parrot)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    {isSubmitting ? 'Submitting...' : isUploading ? 'Uploading images...' : 'Submit Skill'}
                </button>
            </form>
        </div>
    );
}
