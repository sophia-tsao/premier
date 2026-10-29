import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { driveLink } from "../utils/f_config";
import { useNavigate } from "react-router-dom";

const LP_WEBSITE_URL = "https://www.commonplanner.com/";

const SubjectDrive = () => {
    const navigate = useNavigate();
    const [localSubject, setLocalSubject] = useState([]);
    const [subject, setSubject] = useState('');
    const [isFullDriveUser, setIsFullDriveUser] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);

    useEffect(() => {
        const storedSubjects = JSON.parse(localStorage.getItem('subject'));
        if (Array.isArray(storedSubjects) && storedSubjects.length > 0) {
            setLocalSubject(storedSubjects);

            if (storedSubjects.includes("Full Drive")) {
                setIsFullDriveUser(true);
                setSubject("Full Drive");
            } else {
                setSubject(storedSubjects[0]);
            }
        } else {
            setLocalSubject([]);
        }
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100%',
            position: 'relative'
        }}>
            {/* ⚙️ Gear icon (Only for Full Drive users) */}
            {isFullDriveUser && (
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <button
                        type="button"
                        className="tooltip-trigger tooltip-align-right"
                        data-tooltip="Open admin options"
                        aria-label="Open admin options"
                        onClick={() => setShowAdminMenu(prev => !prev)}
                        style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                        <FontAwesomeIcon
                            icon={faCog}
                            style={{ color: '#b80b92', fontSize: '24px' }}
                        />
                    </button>
                    {showAdminMenu && (
                        <button
                            type="button"
                            className="tooltip-trigger"
                            data-tooltip="Manage users and their assigned subjects"
                            style={{
                                display: 'block',
                                marginTop: '8px',
                                backgroundColor: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                            onClick={() => navigate('/users')}
                        >
                            Admin
                        </button>
                    )}
                </div>
            )}

            {/* Dropdown + Title (only for non-Full Drive users) */}
            {!isFullDriveUser && (
                <>
                    <h1 style={{
                        marginBottom: '20px',
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }}>
                        Select Your Subject
                    </h1>

                    <select
                        onChange={(e) => setSubject(e.target.value)}
                        value={subject}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            backgroundColor: '#f2f2f2',
                            color: '#222',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            margin: '10px 0'
                        }}
                    >
                        {localSubject.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </>
            )}

            {/* Button */}
            <button
                type="button"
                className="tooltip-trigger"
                data-tooltip={isFullDriveUser
                    ? 'Open the full curriculum Drive in a new tab'
                    : `Open the ${subject || 'selected subject'} curriculum Drive in a new tab`}
                onClick={() => {
                    if (subject === '') {
                        alert('Please select a subject');
                        return;
                    }
                    if (!driveLink[subject]) {
                        alert('Drive link not found for selected subject');
                        return;
                    }
                    window.open(driveLink[subject], '_blank');
                }}
                style={{
                    padding: '18px 36px',
                    fontSize: '20px',
                    backgroundColor: '#b80b92',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                    margin: '20px 0'
                }}
            >
                Access {isFullDriveUser ? 'Curriculum' : `${subject} Curriculum`}
            </button>

            <button
                type="button"
                className="tooltip-trigger"
                data-tooltip="Open the Common Planner website in a new tab"
                onClick={() => {
                    window.open(LP_WEBSITE_URL, '_blank', 'noopener,noreferrer');
                }}
                style={{
                    padding: '14px 30px',
                    fontSize: '18px',
                    backgroundColor: '#f2f2f2',
                    color: '#222',
                    border: '1px solid #ccc',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    margin: '0 0 20px'
                }}
            >
                Open Common Planner
            </button>
        </div>
    );
}

export default SubjectDrive;
