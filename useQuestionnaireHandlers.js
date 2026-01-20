/** hooks/useQuestionnaireHandlers.js */
import { getData, updateData } from "../utils/idbUtils";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Utils } from "formiojs";
import { getSubmissionByAssignmentUidAndVerNo, updateQuestionnaireState } from '../features/slices/questionnaireSlice';

export const useQuestionnaireHandlers = ({
    assignment,
    formIOSchema,
    errList,
    followUpList,
    lastRoundData,
    setFormSchema = () => {},
    setAlertContent = () => {},
    setPrefillSchema = () => {},
    setPrefillFormContent = () => {},
    setPrefillLocale = () => {},
    setPrefillLatestVersion = () => {},
    setVerifyDetail = () => {},

}) => {

    const dispatch = useDispatch();    
    const navigate = useNavigate()  

    const downloadJSON = async (content) => {
        let submission = null;
        try {
            const res = await dispatch(getSubmissionByAssignmentUidAndVerNo({
                pAssignmentUid: assignment.ASGN_UID,
                pQDataVerNo: content.Q_DATA_VER_NO,
            })).unwrap();

            submission = res.data.submission?.find((item) => item.Form_ID == assignment.TEMP_DOC_REF_NO || item.Assignment_Uid == assignment.ASGN_UID);
        } catch {
            const subKey = ['submission', 'indoorSubmission', 'fieldSubmission', 'followupSubmission'].find((key) => assignment[key]?.find((sub) => sub.Form_ID == assignment.TEMP_DOC_REF_NO || sub.Assignment_Uid == assignment.ASGN_UID)?.Version == content.Q_DATA_VER_NO);
            submission = assignment[subKey].find((item) => item.Form_ID == assignment.TEMP_DOC_REF_NO || item.Assignment_Uid == assignment.ASGN_UID);
        }

        if (submission) {
            const output = {
                Submission_Validation: JSON.parse(submission.Submission_Validation),
                Submission_Error: JSON.parse(submission.Submission_Error),
                Submission_FollowUp: JSON.parse(submission.Submission_FollowUp),
                Submission_ByPass: JSON.parse(submission.Submission_ByPass),
            };
            const jsonContent = JSON.stringify(output, null, 2); // Indentation level of 2
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', assignment.ASGN_REF_NO + '_Ver' + content.Q_DATA_VER_NO);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };   

    const navigatePreview = async (content) => {
        console.log('dddd', formIOSchema)
        setFormSchema(formIOSchema);
        if (!formIOSchema) {
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: 'Error',
                msg: 'No questionnaire'
            })
            return
        }

        let engList = formIOSchema.Language ? JSON.parse(formIOSchema.Language) : {};
        const subFormLanguage = getSubForm(formIOSchema).map(form => form?.Language ? JSON.parse(form.Language) : {});
        subFormLanguage.forEach(lang => {
            engList = {
                ...engList,
                ...lang,
            };
        });

        let zhList = {};
        Object.keys(engList).forEach(k => {
            zhList[k] = k;
        });

        let submission = null;
        let images = null
        const subFormList = Utils.searchComponents(formIOSchema.components, { type: 'form' }).map(form => ({
            key: form.key,
            id: form.form,
        }));

        try {
            const res = await dispatch(getSubmissionByAssignmentUidAndVerNo({
                pAssignmentUid: assignment.ASGN_UID,
                pQDataVerNo: content.Q_DATA_VER_NO,
            })).unwrap();
            submission = res.data.submission;
            images = res.data.images
        } catch {
            const subKey = ['submission', 'indoorSubmission', 'fieldSubmission', 'followupSubmission'].find(key => assignment[key]?.find(sub => sub.Form_ID == assignment.TEMP_DOC_REF_NO || sub.Assignment_Uid == assignment.ASGN_UID)?.Version == content.Q_DATA_VER_NO);
            submission = assignment[subKey];
            images = assignment.QuestionnaireImages ?? []
        }

        let { Submission_FormIo, Submission_Error, Submission_FollowUp, Submission_ByPass, Submission_Cleared } = submission?.find(item => item.Form_ID == assignment.TEMP_DOC_REF_NO || item.Assignment_Uid == assignment.ASGN_UID);
        let Submission_FormIo_Obj = JSON.parse(Submission_FormIo);

        subFormList.forEach(form => {
            if (!submission?.some(item => item.Form_ID == form.id)) return;
            getFirstObject(Submission_FormIo_Obj)[form.key] = getFirstObject(JSON.parse(submission?.find(item => item.Form_ID == form.id).Submission_FormIo));
        });

        if (content.ENUM_MDE == 'O') {
            getAllObjects(Submission_FormIo_Obj).forEach(formObj => {
                assignment.prefillList.filter(({ FLD_TYP }) => FLD_TYP == 'O'|| FLD_TYP == 'S').forEach(({ FLD_NAME, FLD_VAL }) => {
                    if (formObj[FLD_NAME]) return;
                    formObj[FLD_NAME] = FLD_VAL[0];
                });
            });
        }

        // Save questionnaire images in idb
        const data = await getData('DCP', 'assignment', assignment.GUID)
        if (data) {
            await updateData('DCP', 'assignment', assignment.GUID, null, {
                ...assignment,
                QuestionnaireImages: images
            })
        }
        
        dispatch(updateQuestionnaireState({
            key: 'info',
            value: {
                option: {
                    language: 'zh',
                    i18n: {
                        zh: {
                            ...zhList
                        },
                        en: {
                            ...engList
                        }
                    },
                    buttonSettings: {showSubmit: false, showCancel: false},
                    alwaysDirty: true,
                    readOnly: true,
                    showHiddenFields: true,
                },
                submission: Submission_FormIo_Obj,
                errList: errList,
                followUpList: followUpList,
                formGUID: assignment.TEMP_DOC_REF_NO + '_' + assignment.TMPL_VLD_VER_NO,
                date: {
                    YYYY: assignment.YYYY,
                    MM: assignment.MM,
                },
            }
        })).then(

            dispatch(
                updateQuestionnaireState({
                    key: 'drawerList',
                    value: {
                        errCodingList: submission?.flatMap((sub) => sub.Submission_Error ? JSON.parse(sub.Submission_Error) : []) ?? [],
                        FUList: submission?.flatMap((sub) => sub.Submission_FollowUp ? JSON.parse(sub.Submission_FollowUp) : []) ?? [],
                        bypassList: submission?.flatMap((sub) => sub.Submission_ByPass ? JSON.parse(sub.Submission_ByPass) : []) ?? [],
                        clearList: submission?.flatMap((sub) => sub.Submission_Cleared ? JSON.parse(sub.Submission_Cleared) : []) ?? [],
                    },
                })
            )
        ).then(
            
            dispatch(
                updateQuestionnaireState({
                    key: 'latestVersion',
                    value: content.Q_DATA_VER_NO - 1,
                })
            )
        );

        navigate('questionnaire/preview');
    };

    const navigateDataConflict = (content) => {
        const state = {
            DataConflictDetails: [
                {
                    Q_DATA_VER_NO: content.Q_DATA_VER_NO,
                    ENUM_MDE: content.ENUM_MDE,
                },
            ],
        };
        navigate('questionnaire/review', {
            state: {
                dataConflictContent: state,
            },
        });
    }; 

    const navigatePrefill = async (content, isCompare) => {
        setFormSchema(formIOSchema);
        if (!formIOSchema) {
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: 'Error',
                msg: 'No questionnaire',
            });
            return;
        }
        let engList = formIOSchema.Language ? JSON.parse(formIOSchema.Language) : {};
        const subFormLanguage = getSubForm(formIOSchema).map((form) => form?.Language ? JSON.parse(form.Language) : {});
        subFormLanguage.forEach((lang) => {
            engList = {
                ...engList,
                ...lang,
            };
        });
        let zhList = {};
        Object.keys(engList).forEach((k) => {
            zhList[k] = k;
        });

        let submission = null;
        const subFormList = Utils.searchComponents(formIOSchema.components, { type: 'form', }).map((form) => ({
            key: form.key,
            id: form.form,
        }));

        if(isCompare) {
            try {
                const res = await dispatch(
                    getSubmissionByAssignmentUidAndVerNo({
                        pAssignmentUid: assignment.ASGN_UID,
                        pQDataVerNo: content.Q_DATA_VER_NO,
                    })
                ).unwrap();
                
                if(res?.data?.images){
                    await getData('DCP', 'assignment', assignment.GUID).then(data => {
                            if (data) {
                                updateData("DCP", "assignment", data.GUID, null,
                                    {
                                        ...data,
                                        QuestionnaireImages:res?.data?.images
                                    });
                            }
                        });
                }

                submission = res.data.submission;
            } catch {
                const subKey = ['submission', 'indoorSubmission', 'fieldSubmission', 'followupSubmission'].find((key) => assignment[key]?.find((sub) => sub.Form_ID == assignment.TEMP_DOC_REF_NO || sub.Assignment_Uid == assignment.ASGN_UID)?.Version == content.Q_DATA_VER_NO);
                submission = assignment[subKey];
            }
        }else{
            submission = assignment.lastRoundSubmission
        }

        // #677
        let { Submission_FormIo, Submission_Error, Submission_FollowUp, Submission_ByPass, Submission_Cleared } = submission?.find(item => item.Form_ID == assignment.TEMP_DOC_REF_NO || item._id == assignment.lastRoundSubmission[0]._id || item.Form_ID == assignment.lastRoundSubmission[0].Form_ID)
        // let { Submission_FormIo, Submission_Error, Submission_FollowUp, Submission_ByPass, Submission_Cleared } = submission?.find((item) => item.Form_ID == assignment.TEMP_DOC_REF_NO || item.Assignment_Uid == assignment.ASGN_UID);
        let Submission_FormIo_Obj = JSON.parse(Submission_FormIo);

        subFormList.forEach((form) => {
            if (!submission?.some((item) => item.Form_ID == form.id)) return;
            getFirstObject(Submission_FormIo_Obj)[form.key] = getFirstObject(JSON.parse(submission?.find((item) => item.Form_ID == form.id).Submission_FormIo));
        });
        if (content.ENUM_MDE == 'O') {
            getAllObjects(Submission_FormIo_Obj).forEach((formObj) => {
                assignment.prefillList.filter(({ FLD_TYP }) => FLD_TYP == 'O'|| FLD_TYP == 'S').forEach(({ FLD_NAME, FLD_VAL }) => {
                    if (formObj[FLD_NAME]) return;
                    formObj[FLD_NAME] = FLD_VAL[0];
                });
            });
        }

        const info = {
            option: {
                language: 'zh',
                i18n: {
                    zh: {
                        ...zhList
                    },
                    en: {
                        ...engList
                    }
                },
                buttonSettings: { showSubmit: false, showCancel: false },
                alwaysDirty: true,
                readOnly: true,
                showHiddenFields: true,
            },
            submission: Submission_FormIo_Obj,
            errList: errList,
            followUpList: followUpList,
            formGUID: assignment.TEMP_DOC_REF_NO + '_' + assignment.TMPL_VLD_VER_NO,
            schema: [formIOSchema],
            date: {
                YYYY: assignment.YYYY,
                MM: assignment.MM,
            },
        };

        const drawerList = {
            errCodingList: submission?.flatMap(sub => sub.Submission_Error ? JSON.parse(sub.Submission_Error) : []) ?? [],
            FUList: submission?.flatMap(sub => sub.Submission_FollowUp ? JSON.parse(sub.Submission_FollowUp) : []) ?? [],
            bypassList: submission?.flatMap(sub => sub.Submission_ByPass ? JSON.parse(sub.Submission_ByPass) : []) ?? [],
            clearList: submission?.flatMap(sub => sub.Submission_Cleared ? JSON.parse(sub.Submission_Cleared) : []) ?? [],
        };

        const latestVersion = content.Q_DATA_VER_NO - 1;
        setPrefillSchema(info.schema[0])
        const prefillSubmission = info.submission[0] || info.submission

        setPrefillFormContent(c => {
            let temp=[] ;
           // temp = [...c];
            if (isCompare) {
                let { form = null, form1 = null, ...mainForm } = prefillSubmission || {};
                temp[0] = {...mainForm,SUBMISSION_NAME:content.Q_DATA_VER_NO};
                if (!lastRoundData) {
                    try {
                        temp[1] = JSON.parse(assignment.lastRoundSubmission[0].Submission_FormIo)[0];
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        // Handle error appropriately, e.g., set temp[1] to a default value or null
                        temp[1] = null;
                    }
                } else {
                    temp[1] = lastRoundData;
                }


            } else{
                temp[0] = prefillSubmission;
            }
            return temp;
        });

        setPrefillLocale('zh')
        setPrefillLatestVersion(latestVersion + 1)

        setVerifyDetail(true)
    };


    /***************************************************************************************************************************************************************
     *                                                                           Helper                                                                            *
     ***************************************************************************************************************************************************************/
    const getSubForm = (questionnaire) => {
        return (Utils.searchComponents(questionnaire.components, { type: 'form', }) ?? []);
    };
    const getAllObjects = (input) => {
        const result = [];
        if (Array.isArray(input)) {
            result.push(...input.flatMap((sub) => getAllObjects(sub)));
        } else if (typeof input == 'object' && input !== null) {
            result.push(input);
            Object.values(input).forEach((item) =>
                result.push(...getAllObjects(item))
            );
        }
        return result;
    };
    const getFirstObject = (content) => {
        if (Array.isArray(content)) {
            return getFirstObject(content[0])
        }
        return content
    };

    return {
        downloadJSON,
        navigatePreview,
        navigateDataConflict,
        navigatePrefill,        
    };
};