import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
//import { useNavigate } from 'react-router-dom';
import { 
    Button, Spinner, Center, VStack, 
} from "@chakra-ui/react";
import { 
    getAssignmentByGuidWithoutViewScopeAndQuestionnaireAndQCLog,
    getAssignmentByGuidWithoutViewScope,
    updateState 
} from "../features/slices/assignmentSlice"; 
import { DisplayDataModal } from './DisplayDataModal';
//import { Utils } from "formiojs";
import { tokenDecoder } from "../utils/networkUtils";
import DataTable from "./DataTable";  
import { QuestionnairePrefillTable } from '../pages/questionnaire/QuestionnairePrefillTable';
import { useSubmitVersionStructure } from '../hooks/useSubmitVersionStructure';
import { useQuestionnaireHandlers } from '../hooks/useQuestionnaireHandlers';
import { useLocalStorage } from "../hooks/useLocalStorage";

const QuickViewModal = ({ isOpen, onClose, guid }) => {
    const dispatch = useDispatch();    

    const [isOnline, setIsOnline] = useLocalStorage('IS_ONLINE');
    const [isLoading, setIsLoading] = useState(false);
    const [assignment, setAssignment] = useState(null); 
    const [info, setInfo] = useState(null);             
    
    const [isBasicDataReady, setIsBasicDataReady] = useState(false);
    
    /** Version Table */
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
   

    /** Prefill modal */
    const [isPrefillOpen, setIsPrefillOpen] = useState(false);    
    const [prefillSchema, setPrefillSchema] = useState(null);
    const [prefillFormContent, setPrefillFormContent] = useState([]);
    const [prefillLocale, setPrefillLocale] = useState('zh');
    const [prefillLatestVersion, setPrefillLatestVersion] = useState(null);

    
    /** InterviewLog state */   
    const [alertContent, setAlertContent] = useState(null);
    const [formIOSchema, setFormIOSchema] = useState(null);
    const [formSchema, setFormSchema] = useState({});
    const [currentVersion, setCurrentVersion] = useState(null);
    const [verifyDetail, setVerifyDetail] = useState(null)
    const [isDisplayDownload, setIsDisplayDownload] = useState(false);

    const { 
        questionnaireDataTypeList, 
        questionnaireDataStatusList, 
        EnumerationModesList,
        lastRoundData 
    } = useSelector(state => ({
        questionnaireDataTypeList: state.common.questionnaireDataTypeList,
        questionnaireDataStatusList: state.common.questionnaireDataStatusList,
        EnumerationModesList: state.common.EnumerationModesList,
        lastRoundData: state.questionnaire.lastRoundData,
    }));

    /***************************************************************************************************************************************************************
     *                                                                          Data Flow                                                                          *
     ***************************************************************************************************************************************************************/
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
                pStaffUid: user.id, 
                pStaffPositionUid: user.stf_position,
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

    useEffect(() => {
        if (assignment?.LastRoundSubmissionObject?.[0]?.Submission_FormIo) {
            const lastRoundParsed = JSON.parse(assignment.LastRoundSubmissionObject[0].Submission_FormIo || '{}');
            setPrefillFormContent([lastRoundParsed]);
            setPrefillSchema(info?.schema?.[0]);
            setPrefillLatestVersion(info?.submission?.[0]?.LAT_Q_DATA_VER_NO || 0);
        }
    }, [assignment, info]);

    /***************************************************************************************************************************************************************
     *                                                                           Handler                                                                           *
     ***************************************************************************************************************************************************************/
    const handlePreviewClick = () => {
        console.log('handlePreviewClick called, SubmissionVersionObject length:', assignment?.SubmissionVersionObject?.length || 0);
        setIsVersionModalOpen(true);  
    };

    const handlePrefilledClick = () => {
        if (prefillSchema && prefillFormContent.length > 0) {
            setIsPrefillOpen(true);
        }
    };

    const { downloadJSON, navigatePreview, navigateDataConflict, navigatePrefill } = useQuestionnaireHandlers({
        assignment: assignment,
        formIOSchema: formIOSchema,
        lastRoundData: lastRoundData,
        setFormSchema: setFormSchema,
        setAlertContent: setAlertContent,
        setPrefillSchema: setPrefillSchema,
        setPrefillFormContent: setPrefillFormContent,
        setPrefillLocale: setPrefillLocale,
        setPrefillLatestVersion: setPrefillLatestVersion,
        setVerifyDetail: setVerifyDetail
    })

    /***************************************************************************************************************************************************************
     *                                                                        Version Table                                                                        *
     ***************************************************************************************************************************************************************/
    const submitVersionStructure = useSubmitVersionStructure({
        currentVersion, setCurrentVersion,
        isDisplayDownload, setIsDisplayDownload,
        downloadJSON: downloadJSON,
        navigatePreview: navigatePreview,
        navigateDataConflict: navigateDataConflict,
        navigatePrefill: navigatePrefill,
        isOnline,
        assignment,
        questionnaireDataTypeList,
        questionnaireDataStatusList,
        EnumerationModesList,
    });


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
                                isDisabled={!isBasicDataReady || isLoading || !assignment?.LastRoundSubmissionObject?.length}
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

            <DisplayDataModal
                title="View Pre-filled Answer"
                isModalOpen={isPrefillOpen}
                onCloseModal={() => setIsPrefillOpen(false)}
                isFixSize={true}
                >
                <QuestionnairePrefillTable
                    schema={prefillSchema}
                    formContent={prefillFormContent}
                    locale={prefillLocale}
                    latestVersion={prefillLatestVersion}
                />
            </DisplayDataModal>

            {alertContent && (
            <DisplayDataModal title={alertContent.title} onClose={() => setAlertContent(null)}>
                <Text>{alertContent.body}</Text>
                <Button onClick={() => setAlertContent(null)}>OK</Button>
            </DisplayDataModal>
            )}
        </>
    );
};

export default QuickViewModal;
