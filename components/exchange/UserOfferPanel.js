// components/exchange/UserOfferPanel.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { Edit3, Save, Users, DollarSign, Clock, Calendar, MapPin, Plus, X } from 'lucide-react';

export default function UserOfferPanel({
    exchangeId,
    currentUser,
    onOfferUpdate
}) {
    // Core state
    const [offerData, setOfferData] = useState(null);
    const [roleInfo, setRoleInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Deliverable management
    const [deliverables, setDeliverables] = useState([]);
    const [newDeliverable, setNewDeliverable] = useState('');
    // NEW: User skills and selected skill
    const [userSkills, setUserSkills] = useState([]);
    // Holds title of skill not in userSkills (e.g., initiator's skill)
    const [externalSkill, setExternalSkill] = useState(null);
    const [skillId, setSkillId] = useState('');

    // Form refs for performance (no re-renders while typing)
    const descriptionRef = useRef(null);
    const amountRef = useRef(null);
    const currencyRef = useRef(null);
    const paymentTimelineRef = useRef(null);
    const hoursRef = useRef(null);
    const deadlineRef = useRef(null);
    const deliveryMethodRef = useRef(null);

    // FIXED: Populate form refs with current data
    const populateFormRefs = (negotiationData, roleData) => {
        if (!negotiationData || !roleData) return;

        // Populate form refs with current values
        if (descriptionRef.current) {
            descriptionRef.current.value = negotiationData.terms.descriptions[roleData.exchangeRole] || '';
        }
        if (amountRef.current) {
            amountRef.current.value = negotiationData.terms.amount || '';
        }
        if (currencyRef.current) {
            currencyRef.current.value = negotiationData.terms.currency || 'USD';
        }
        if (paymentTimelineRef.current) {
            paymentTimelineRef.current.value = negotiationData.terms.paymentTimeline || 'completion';
        }
        if (hoursRef.current) {
            hoursRef.current.value = negotiationData.terms.hours[roleData.exchangeRole] || '';
        }
        if (deadlineRef.current && negotiationData.terms.deadline) {
            deadlineRef.current.value = new Date(negotiationData.terms.deadline).toISOString().split('T')[0];
        }
        if (deliveryMethodRef.current) {
            deliveryMethodRef.current.value = negotiationData.terms.method || 'flexible';
        }

        // Set deliverables
        setDeliverables(negotiationData.terms.deliverables[roleData.exchangeRole] || []);

        // Set selected skill
        setSkillId(negotiationData.terms?.skillIds?.[roleData.exchangeRole]?.toString() || '');
    };

    // NEW: Fetch user's skills
    const fetchUserSkills = async () => {
        try {
            const res = await fetch('/api/skills/my-skills', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setUserSkills(data.skills.map((s) => ({ ...s, id: s.id.toString() })));
            }
        } catch (err) {
            console.error('Failed to load user skills', err);
        }
    };

    // Fetch user's offer data and role
    const fetchOfferData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/exchanges/${exchangeId}/negotiation/offer`, {
                cache: 'no-store'
            });
            const data = await response.json();

            if (data.success) {
                setOfferData(data.negotiation);
                setRoleInfo(data.roleInfo);

                // FIXED: Use separate function to populate refs
                populateFormRefs(data.negotiation, data.roleInfo);

                // Fetch user skills if user is skill provider
                if (data.roleInfo.businessRole === 'skill_provider') {
                    fetchUserSkills();
                }
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch offer data');
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        if (exchangeId && currentUser) {
            fetchOfferData();
        }
    }, [exchangeId, currentUser]);

    // FIXED: Update refs when offerData changes (after successful saves)
    useEffect(() => {
        if (offerData && roleInfo && !isEditing) {
            populateFormRefs(offerData, roleInfo);
        }
    }, [offerData, roleInfo, isEditing]);

    // Update specific field
    const updateField = async (fieldName, fieldValue) => {
        try {
          setSaving(true);
          setError(null);                   // reset any previous error
          const response = await fetch(`/api/exchanges/${exchangeId}/negotiation/offer`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldName, fieldValue }),
            cache: 'no-store'
          });
      
          const data = await response.json();
        //   console.log(data)
          if (data.success) {
            setOfferData(data.negotiation);
            onOfferUpdate?.(data.negotiation);
            setError(null);                   // clear error after success
            return true;
          } else {
            setError(data.error);
            return false;
          }
        } catch (err) {
          setError('Failed to update field');
          return false;
        } finally {
          setSaving(false);
        }
      };

    // Add deliverable
    const addDeliverable = () => {
        if (newDeliverable.trim()) {
            const updatedDeliverables = [...deliverables, { title: newDeliverable.trim() }];
            setDeliverables(updatedDeliverables);
            setNewDeliverable('');
        }
    };

    // Remove deliverable
    const removeDeliverable = (index) => {
        const updatedDeliverables = deliverables.filter((_, i) => i !== index);
        setDeliverables(updatedDeliverables);
    };

    // Save all changes
    const saveChanges = async () => {
        if (!roleInfo) return;

        const updates = [];

        // Collect all field updates based on role
        if (roleInfo.businessRole === 'money_provider') {
            if (descriptionRef.current?.value !== offerData?.terms.descriptions[roleInfo.exchangeRole]) {
                updates.push({
                    fieldName: 'description',
                    fieldValue: descriptionRef.current.value
                });
            }
            if (amountRef.current?.value !== offerData?.terms.amount?.toString()) {
                updates.push({
                    fieldName: 'amount',
                    fieldValue: parseFloat(amountRef.current.value) || 0
                });
            }
            if (currencyRef.current?.value !== offerData?.terms.currency) {
                updates.push({
                    fieldName: 'currency',
                    fieldValue: currencyRef.current.value
                });
            }
            if (paymentTimelineRef.current?.value !== offerData?.terms.paymentTimeline) {
                updates.push({
                    fieldName: 'payment_timeline',
                    fieldValue: paymentTimelineRef.current.value
                });
            }
        } else if (roleInfo.businessRole === 'skill_provider') {
            if (hoursRef.current?.value !== offerData?.terms.hours[roleInfo.exchangeRole]?.toString()) {
                updates.push({
                    fieldName: 'hours',
                    fieldValue: parseInt(hoursRef.current.value) || 0
                });
            }
            // skill selection (only if user is initiator skill provider)
            if (roleInfo.exchangeRole === 'initiator' && skillId && skillId !== (offerData?.terms?.skillIds?.[roleInfo.exchangeRole]?.toString() || '')) {
                const selectedSkill = userSkills.find((s) => s.id === skillId);
                updates.push({
                    fieldName: 'skill_id',
                    fieldValue: skillId
                });
                if (selectedSkill && selectedSkill.title !== offerData?.terms.descriptions[roleInfo.exchangeRole]) {
                    updates.push({
                        fieldName: 'description',
                        fieldValue: selectedSkill.title
                    });
                }
            }

            if (deadlineRef.current?.value) {
                const currentDeadline = offerData?.terms.deadline ? new Date(offerData.terms.deadline).toISOString().split('T')[0] : '';
                if (deadlineRef.current.value !== currentDeadline) {
                    updates.push({
                        fieldName: 'deadline',
                        fieldValue: deadlineRef.current.value
                    });
                }
            }
            if (deliveryMethodRef.current?.value !== offerData?.terms.method) {
                updates.push({
                    fieldName: 'method',
                    fieldValue: deliveryMethodRef.current.value
                });
            }
        }

        // Update deliverables
        const currentDeliverables = offerData?.terms.deliverables[roleInfo.exchangeRole] || [];
        if (JSON.stringify(deliverables) !== JSON.stringify(currentDeliverables)) {
            updates.push({
                fieldName: 'deliverables',
                fieldValue: deliverables
            });
        }

        // Execute updates sequentially
        let allSuccessful = true;
        for (const update of updates) {
            const success = await updateField(update.fieldName, update.fieldValue);
            if (!success) {
                allSuccessful = false;
                break;
            }
        }

        // FIXED: Only exit editing mode if all updates were successful
        if (allSuccessful) {
            setIsEditing(false);
        }
    };

    // Cancel editing
    const cancelEditing = () => {
        setIsEditing(false);
        // FIXED: Reset form values from current offerData instead of fetching
        if (offerData && roleInfo) {
            populateFormRefs(offerData, roleInfo);
        }
    };

    // Render editable fields based on role
    const renderEditableFields = () => {
        if (!roleInfo || !offerData) return null;

        const { businessRole } = roleInfo;

        return (
            <div className="space-y-4">
                {/* Description (money provider only) */}
                {businessRole === 'money_provider' && (
                    <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                            What you need
                        </label>
                        <textarea
                            ref={descriptionRef}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                            rows={3}
                            placeholder="Describe what you need..."
                            disabled={!isEditing}
                        />
                    </div>
                )}

                {/* Money Provider Fields */}
                {businessRole === 'money_provider' && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                    Amount
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        ref={amountRef}
                                        type="number"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        placeholder="0"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                    Currency
                                </label>
                                <select
                                    ref={currencyRef}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    disabled={!isEditing}
                                >
                                    <option value="INR">INR</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                Payment Timeline
                            </label>
                            <select
                                ref={paymentTimelineRef}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                disabled={!isEditing}
                            >
                                <option value="completion">Pay on completion</option>
                                <option value="upfront">Pay upfront</option>
                                <option value="split">Split payment</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Skill Provider Fields */}
                {/* Skill Selection */}
                {/* Skill Selection or Display */}
                {businessRole === 'skill_provider' && (
                    roleInfo.exchangeRole === 'initiator' ? (
                        <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Select Skill</label>
                            <select
                                value={skillId || ''}
                                onChange={(e) => setSkillId(e.target.value)}
                                disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                                <option value="">-- Choose skill --</option>
                                {userSkills.map((skill) => (
                                    <option key={skill.id} value={skill.id}>{skill.title}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Skill</label>
                            <div className="w-full p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                                {(
                                    userSkills.find((s) => s.id === skillId)?.title ||
                                    externalSkill?.title ||
                                    offerData?.terms?.descriptions?.[roleInfo.exchangeRole] ||
                                    'Selected Skill'
                                )}
                            </div>
                        </div>
                    )
                )}

                {businessRole === 'skill_provider' && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                    Hours
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        ref={hoursRef}
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        placeholder="0"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                    Deadline
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        ref={deadlineRef}
                                        type="date"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                Delivery Method
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    ref={deliveryMethodRef}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    disabled={!isEditing}
                                >
                                    <option value="flexible">Flexible</option>
                                    <option value="online">Online</option>
                                    <option value="in-person">In-person</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {/* Deliverables (both roles) */}
                <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Deliverables
                    </label>

                    {/* Existing deliverables */}
                    <div className="space-y-2 mb-3">
                        {deliverables.map((deliverable, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                                <span className="flex-1 text-sm text-gray-900 dark:text-white">
                                    {deliverable.title}
                                </span>
                                {isEditing && (
                                    <button
                                        onClick={() => removeDeliverable(index)}
                                        className="p-1 text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add new deliverable */}
                    {isEditing && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newDeliverable}
                                onChange={(e) => setNewDeliverable(e.target.value)}
                                placeholder="Add deliverable..."
                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && addDeliverable()}
                            />
                            <button
                                onClick={addDeliverable}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Your Offer ({roleInfo?.businessRole === 'money_provider' ? 'Payment' : 'Service'})
                        </h3>
                    </div>

                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-xs font-medium"
                        >
                            <Edit3 className="w-3 h-3" />
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-xs font-medium"
                            >
                                <Save className="w-3 h-3" />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={cancelEditing}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm">
                        {error}
                    </div>
                )}

                {renderEditableFields()}
            </div>
        </div>
    );
}
