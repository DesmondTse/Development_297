import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    Button, Spinner, Center, VStack, 
} from "@chakra-ui/react";
import { 
    getAssignmentByGuidWithoutViewScopeAndQuestionnaireAndQCLog,
    getAssignmentByGuidWithoutViewScope,
    updateState 
} from "../features/slices/assignmentSlice"; 
import { updateQuestionnaireState } from "../features/slices/questionnaireSlice";
import { DisplayDataModal } from './DisplayDataModal';
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tokenDecoder } from "../utils/networkUtils";
import DataTable from "./DataTable";  

const QuickViewModal = ({ isOpen, onClose, guid }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const questionnaireState = useSelector(state => state.questionnaire); 
    
    const [isLoading, setIsLoading] = useState(false);
    const [assignment, setAssignment] = useState(null); 
    const [info, setInfo] = useState(null);             
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    const [isBasicDataReady, setIsBasicDataReady] = useState(false);
    const [isOnline, setIsOnline] = useLocalStorage('IS_ONLINE');

    const { questionnaireDataTypeList, questionnaireDataStatusList, EnumerationModesList } = useSelector(state => state.common);  // 假設從 Redux 取

    const submitVersionStructure = [
        { header: "Version", inputType: "text", key: "Q_DATA_VER_NO" },
        { header: "Preview", inputType: "custome", key: "", cell: (content) => {
            const submissionList = [assignment?.submission, assignment?.indoorSubmission, assignment?.followupSubmission, assignment?.fieldSubmission];
            const target = submissionList.filter(item => item?.length).flat().find(item => assignment.TEMP_DOC_REF_NO == item.Form_ID && item.Version == content.Q_DATA_VER_NO);
            return <Button variant={'blue'} onClick={() => {
                setIsVersionModalOpen(false);
                goToQuestionnaire(content, 1);
            }} isDisabled={!isOnline && !target} > Preview </Button>;
        } },
        { header: 'Compare Pre-filled', inputType: 'custome', key: '', cell: (content) => {
            const submissionList = [assignment?.submission, assignment?.indoorSubmission, assignment?.followupSubmission, assignment?.fieldSubmission];
            const target = submissionList.filter(item => item?.length).flat().find(item => assignment.TEMP_DOC_REF_NO == item.Form_ID && item.Version == content.Q_DATA_VER_NO);
            return assignment?.lastRoundSubmission?.length > 0 && <Button variant={'blue'} onClick={() => {
                setIsVersionModalOpen(false);
                goToQuestionnaire(content, 1, true); 
            }} isDisabled={!isOnline && !target} > Compare </Button>;
        } },
        { header: "Questionnaire Data Type", inputType: "text-select", key: "Q_DATA_TYP", contentKey: "Q_DATA_TYP", targetKey: "value", displayKey: "label", list: questionnaireDataTypeList },
        { header: 'Data Conflict Status', inputType: 'text', key: 'DF_STS_DESCR' },
        { header: 'Complete/Partial', inputType: 'text-select', key: 'Q_DATA_STS', contentKey: 'Q_DATA_STS', targetKey: 'value', displayKey: 'label', list: questionnaireDataStatusList },
        { header: 'Enum Mode', inputType: 'text-select', key: 'ENUM_MDE', contentKey: 'ENUM_MDE', targetKey: 'value', displayKey: 'label', list: EnumerationModesList.map(item => item.value === "P" ? { value: item.value, label: null } : item) },
        { header: 'Created By', inputType: 'text', key: 'CRE_BY' },
        { header: 'Create Time', inputType: 'text-date-time', key: 'CRE_DT' },
        { header: 'Review Status', inputType: 'text', key: 'RVW_STS_DESCR' },
        { header: 'Review By', inputType: 'text', key: 'RVW_BY_STF_NAME_ENG' },
        { header: 'Review Time', inputType: 'text-date', key: 'RVW_DT' },
        { header: 'Updated By', inputType: 'text', key: 'UPD_BY' },
        { header: 'Updated Time', inputType: 'text-date-time', key: 'UPD_DT' },
    ];

    const handleAssignmentData = (data) => {
        return {
            ...data,
            InterviewLogListObject: data.InterviewLogListObject || [],
            SubmissionObject: data.SubmissionObject || [],
            SubmissionVersionObject: data.SubmissionVersionObject || [],
            LastRoundSubmissionObject: data.LastRoundSubmissionObject || [], 
        };
    };

    const handleQuestionnaireData = useCallback((assignmentList) => {
        if (assignmentList?.length > 0) {
            let tempQuestionnaire = [];
            let tempSubmission = [];
            let tempAssignment = [];
            
            assignmentList.forEach((item) => {
                if (item.QuestionnaireObject?.length > 0) {
                    item.QuestionnaireObject.forEach((q) => {
                        try {
                            let tempQ = JSON.parse(q.TMPL_JSON); 
                            tempQ.Questionnaire_UID = q.Q_UID;
                            tempQ.Q_DATA_VER_NO = q.Q_DATA_VER_NO;
                            tempQuestionnaire.push(tempQ);
                        } catch (e) {
                            console.error("Parse Schema Error", e);
                        }
                    });
                }
                if (item.SubmissionObject?.length > 0) {
                    item.SubmissionObject.forEach((s) => {
                        tempSubmission.push(s);
                    });
                }
                tempAssignment.push(item);
            });

            return {
                schema: tempQuestionnaire,
                submission: tempSubmission,
                assignment: tempAssignment,
            };
        }
        return null;
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const user = tokenDecoder();
            const payload = {
                pAssignmentGuid: guid,
                pStaffUid: user.id || user.uid, 
                pStaffPositionUid: user.stf_position || user.position,
            };

            console.log('Fetching data with payload:', payload);

            const resLog = await dispatch(getAssignmentByGuidWithoutViewScopeAndQuestionnaireAndQCLog(payload)).unwrap();
            console.log('resLog (QCLog version):', resLog);

            const resScope = await dispatch(getAssignmentByGuidWithoutViewScope(payload)).unwrap();
            console.log('resScope (full version with questionnaire):', resScope);

            if (resScope.data?.ErrCode === 0 && resScope.data.assignment) { 
                const processedAssignment = handleAssignmentData(resScope.data.assignment);
                setAssignment(processedAssignment);
                setIsBasicDataReady(true);
                console.log('processedAssignment:', processedAssignment);

                dispatch(updateState({ key: 'assignmentList', value: [resScope.data.assignment] }));

                const questionnaireInfo = handleQuestionnaireData([processedAssignment]);
                console.log('questionnaireInfo:', questionnaireInfo);
                console.log('questionnaireInfo.schema length:', questionnaireInfo?.schema?.length || 0);
                setInfo(questionnaireInfo);

                console.log('QuestionnaireObject exists?', !!resScope.data.assignment.QuestionnaireObject);
                console.log('QuestionnaireObject length:', resScope.data.assignment.QuestionnaireObject?.length || 0);
            } else {
                console.error("API Error in resScope:", resScope.data?.ErrMsg || "No data.assignment found");
            }
        } catch (error) {
            console.error("Fetch Data Failed", error);
        } finally {
            setIsLoading(false);
            console.log('Loading finished, isLoading:', false, 'info exists:', !!info, 'info:', info);
        }
    };

    useEffect(() => {
        if (isOpen && guid) fetchData();
    }, [isOpen, guid, dispatch]);

    const goToQuestionnaire = async (targetSubmission, mode, isPrefill = false) => {

        const sub = targetSubmission || info.submission[0];
        
        const drawerList = {
            errList: sub?.Submission_Error ? JSON.parse(sub.Submission_Error) : [],
            codingList: sub?.Submission_Coding ? JSON.parse(sub.Submission_Coding) : [],
            FUList: sub?.Submission_FollowUp ? JSON.parse(sub.Submission_FollowUp) : [],
            bypassList: sub?.Submission_ByPass ? JSON.parse(sub.Submission_ByPass) : [],
            clearList: sub?.Submission_Cleared ? JSON.parse(sub.Submission_Cleared) : [],
        };

        const reduxInfo = {
            ...info,
            submission: targetSubmission ? [targetSubmission] : info.submission
        };

        console.log('Updating Redux state with:', { info: reduxInfo, drawerList, latestVersion: sub?.LAT_Q_DATA_VER_NO || 0 });

        await dispatch(updateQuestionnaireState({ key: 'info', value: reduxInfo }));
        await dispatch(updateQuestionnaireState({ key: 'drawerList', value: drawerList }));
        await dispatch(updateQuestionnaireState({ key: 'latestVersion', value: sub?.LAT_Q_DATA_VER_NO || 0 }));

        console.log('Redux state after update:', questionnaireState);

        onClose();
        const prefillParam = isPrefill ? '&prefill=true' : '';
        navigate(`/questionnaire?mode=${mode}&guid=${guid}${prefillParam}`);
    };

    const handlePreviewClick = () => {
        console.log('handlePreviewClick called, SubmissionVersionObject length:', assignment?.SubmissionVersionObject?.length || 0);
        setIsVersionModalOpen(true);  
    };

    const handlePrefilledClick = () => {
        console.log('handlePrefilledClick called, LastRoundSubmissionObject length:', assignment?.LastRoundSubmissionObject?.length || 0);
        const prefillData = assignment?.LastRoundSubmissionObject?.[0];
        if (prefillData) goToQuestionnaire(prefillData, 0, true);
    };

    return (
        <>
            <DisplayDataModal isModalOpen={isOpen} onCloseModal={onClose}>
                {isLoading ? (
                    <Center p={10}><Spinner color="blue.500" /></Center>
                ) : (
                    <VStack spacing={4} p={5} align="stretch">
                        <Button 
                            w="full"                           
                            colorScheme="yellow" 
                            bg="yellow.400"
                            _hover={{ bg: "yellow.500" }}
                            onClick={handlePreviewClick} 
                            isDisabled={!isBasicDataReady || isLoading}
                        >
                            Preview Questionnaire
                        </Button>
                        
                        {assignment?.LastRoundSubmissionObject?.length > 0 && (
                            <Button 
                                w="full" 
                                colorScheme="green" 
                                bg="green.400"
                                _hover={{ bg: "green.500" }}
                                onClick={handlePrefilledClick} 
                                isDisabled={!isBasicDataReady || isLoading}
                            >
                                View Pre-filled Answer
                            </Button>
                        )}
                    </VStack>
                )}
            </DisplayDataModal>

            <DisplayDataModal 
                title="Submit Version" 
                isModalOpen={isVersionModalOpen} 
                onCloseModal={() => setIsVersionModalOpen(false)}
            >
                <DataTable 
                    tableStructure={submitVersionStructure} 
                    tableContent={assignment?.SubmissionVersionObject || []} 
                    variant={'roundedGreyHeaderOpenBottom'}
                />
            </DisplayDataModal>
        </>
    );
};

export default QuickViewModal;