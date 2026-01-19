import React, { useCallback, useContext, useEffect, useState, useMemo, useRef } from "react";
import {
    Box,
    Container,
    Tooltip,
    Textarea,
    Select,
    Input,
    Checkbox
} from '@chakra-ui/react'
import { connect } from 'react-redux';
import { useLocation, useParams } from "react-router-dom";
import moment from 'moment';
import { useNavigate } from "react-router-dom";
import DataForm from "../../component/DataForm";
import AssignmentInfo from "./AssignmentInfo";
import DataTable from "../../component/DataTable";
import InterviewLog from "../interviewLog/InterviewLog";
import { getData, getAllData, updateData, addData, pAddData, openDB } from "../../utils/idbUtils";
import { updateState, getAssignmentByGuidWithoutViewScope, updateAssignment, cloneSubAssignment, downloadAssignment, updateAssignmentStatus, getAssignmentByStaffUidByPage, getAssignmentByGuidWithoutViewScopeAndQuestionnaire, getAssignmentByGuidWithoutViewScopeAndQuestionnaireAndQCLog } from "../../features/slices/assignmentSlice";
import AppointmentInfo from "../appointment/AppointmentInfo";
import ContactInfo from "../contact/ContactInfo";
import EnquiryInfo from "../enquiry/EnquiryInfo";
import { AlertModal } from "../../component/AlertModal";
import { checkNet, loadingHandler, tokenDecoder } from "../../utils/networkUtils";
import { triggerFetch, setisLoading } from "../../features/slices/commonSlice";
import { DisplayDataModal } from "../../component/DisplayDataModal";
import uuid from "react-uuid";
import { ControlSaveTiles } from "leaflet.offline";
import { setInterviewLog } from "../../features/slices/interviewLogSlice";
import {
    getEFieldCardByAssignmentGuid,
    getSegmentMapCoordinateByStaffUid,
    updateEFieldCard,
} from "../../features/slices/eFieldCardSlice";
import { generatePageController } from "../../utils/tableUtils";
import { orderBy } from "lodash";
import { useTranslation } from "react-i18next";
import { workflowHandling } from "../../features/slices/workflowSlice";
import { ConfirmModal1 } from "../../component/ConfirmModal1";
import { Button } from "../../component/Button";
import { updateQuestionnaireState } from "../../features/slices/questionnaireSlice";
import QcInfo from "../qualityCheck/QcInfo";
import CursoryCheckDetail from "../qualityCheck/CursoryCheckDetail";
import LoadingContext from "../../contexts/LoadingContext";
import assignment from "./Assignment";
import { Utils } from "formiojs";
import { default as SearchableSelect, StylesConfig } from "react-select";
import ReloadContext from "../../contexts/ReloadContext";

function AssignmentDetail(props) {
    let { id } = useParams();
    const navigate = useNavigate();
    const { dispatch, totalPage, totalCount, isLoading, localState, needFetch, workFlowDispatchList, assignmentStatusList, interviewModeList, assignRefuseIndList, assignRefuseLvlList, tabIndex, enumResultList, codingEditingMistakeList, EndOfEnumerationReasonCodeList, delegatedAssignmentApproverList, needCursory, } = props;
    const [tableContent, setTableContent] = useState({});
    const [assignmentDetailCurrentTab, setAssignmentDetailCurrentTab] = useState(tabIndex ?? "More Info.");
    const [isEdit, setIsEdit] = useState(false);
    const [isViewActivity, setIsViewActivity] = useState(false);
    const [contactList, setContactList] = useState(null);
    const [enquiryLogList, setEnquiryLogList] = useState([]);
    const [appointmentList, setAppointmentList] = useState([]);
    const [alertContent, setAlertContent] = useState({});
    const [confirmContent, setConfirmContent] = useState({});
    const [backupRemarks, setBackupRemarks] = useState("");
    const [formContent, setFormContent] = useState({
        pageSize: 10,
        page: 1,
        offSet: 0,
    });
    // const [t, i18n] = useTranslation();
    const [assignmentList, setAssignmentList] = useState([]);
    // const [qctFormContent, setQctFormContent] = useState({});
    const [submissionVersion, setSubmissionVersion] = useState({});
    const [qcDetail, setQcDetail] = useState(null);
    const [needEOE, setNeedEOE] = useState(false);
    const [approverList, setApproverList] = useState([]);
    const [delegateApprover, setDelegateApprover] = useState(null);
    const [reverseApprover, setReverseApprover] = useState(null);
    const [reverseTarget, setReverseTarget] = useState(null);
    const user = useMemo(() => tokenDecoder(), []);
    const { setIsLoading } = useContext(LoadingContext);
    const [enumStatus, setEnumStatus] = useState(null);
    const [isEditStatus, setIsEditStatus] = useState(false);
    const [dbc, $dbc] = useState(null);
    const [isAbleToSelfSubmitApprove, setIsAbleToSelfSubmitApprove] = useState(false);
    const [isQuestionnaireDataReady, setIsQuestionnaireDataReady] = useState(false);

    //============ CR06 changes ============//
    const location = useLocation();
    const getQueryParams = (queryString) => {
        return new URLSearchParams(queryString);
    };
    const queryParams = getQueryParams(location.search);
    const relatedTag = queryParams.get("relatedTag");
    const asgnGuid = queryParams.get('ASGN_GUID');
    const pageSrc = queryParams.get("pageSrc");
    const [isNeedExtraRedirect, setIsNeedExtraRedirect] = useState(false);

    useEffect(() => {
        // Check if ASGN_GUID exists and redirect
        if (asgnGuid) {
            id = asgnGuid;
            navigate(`/main/assignment/${asgnGuid}`);
            setIsNeedExtraRedirect(true);
        }
        console.log("[debug] id update", asgnGuid)
    }, [asgnGuid]);

    // useEffect(() => {
    //     console.log("[debug] relatedTag", relatedTag)
    //     switch (relatedTag){
    //         case "enq":
    //             // setAssignmentDetailCurrentTab("Enquiries")
    //             break;
    //         default:
    //             console.log("[debug] action not implement yet")
    //             break;
    //     }
    // }, [relatedTag]);
    //============ END OF CR06 ============//
    const activeDispatchRef = useRef(null);

    useEffect(() => {
        localStorage.setItem("pageName", "Assignment Details");
        window.dispatchEvent(new Event("fetchPageName"));
        const initializeDb = async () => {
            const db = await openDB("DCP");
            $dbc(db);
        };

        initializeDb();
        return () => {
            console.log("leaving");
            if (dbc) {
                dbc.close();
                console.log("dispatching");
            }
        };
    }, []);
    useEffect(() => {
        //if assignment supervior in supervior role, and status is pending follow up or pending post survey follow up
        //[update] check add logic for extra check in QC IND and assignment status

        //[20250217 update] update can "self submit and approve" when user are inside the supervisor list
        // console.log("[debug] user", user)
        // console.log("[debug] tableContent.ASGN_STS", tableContent.ASGN_STS)
        // console.log("[debug] user.position & tableContent.SEL_APRV_POSN_UID", user.position, tableContent.SEL_APRV_POSN_UID)
        // console.log("[debug] tableContent.FU_QC_IND_YN", tableContent.FU_QC_IND_YN)

        setIsAbleToSelfSubmitApprove(
            (
                (user.id == tableContent.SEL_APRV_STF_UID &&
                    user.position == tableContent.SEL_APRV_POSN_UID
                ) ||
                props.approverList?.flatMap(item => item.Supervisor).find(item => item.POSN_UID == user.position) || user.CFT_IND === "Y"
            )
            &&
            tableContent.FU_QC_IND_YN == 'Y' &&
            (
                tableContent.ASGN_STS == "PFU" || tableContent.ASGN_STS == "PPFU" ||
                tableContent.ASGN_STS == "FUI" || tableContent.ASGN_STS == "PFUI" ||
                tableContent.ASGN_STS == "FQSR" || tableContent.ASGN_STS == "PFQSR"
            )
        )



    }, [user.position, user.id, tableContent.ASGN_STS, assignment?.QualityControlLogObject, tableContent.SEL_APRV_POSN_UID, tableContent.SEL_APRV_STF_UID, props.approverList]);


    const getAllValuesByKey = useCallback((obj, key) => {
        let result = [];
        if (Array.isArray(obj)) {
            obj.forEach((item) => {
                result.push(...getAllValuesByKey(item, key));
            });
        } else if (typeof obj == "object" && obj != null) {
            Object.keys(obj).forEach((k) => {
                if (k == key) {
                    result.push(obj[k]);
                } else {
                    result.push(...getAllValuesByKey(obj[k], key));
                }
            });
        }
        return result;
    }, []);

    const dispatchData = async () => {
        const dispatchId = uuid(); // Unique ID for this dispatch round
        activeDispatchRef.current = dispatchId; // Set this as the active round

        try {
            let skipOfflineSync = false;

            if (localStorage.getItem("skipOfflineSync") !== null) {
                skipOfflineSync = localStorage.getItem("skipOfflineSync");
            }

            if (localStorage.getItem("IS_ONLINE") == "false") {
                throw new Error("Offline Mode");
            }

            setIsLoading(true); // Set loading state
            const [action, assignmentList] = await Promise.all([
                dispatch(getAssignmentByGuidWithoutViewScopeAndQuestionnaireAndQCLog({
                    pAssignmentGuid: id,
                    pStaffUid: user.id,
                    pStaffPositionUid: user.stf_position,
                })),
                getAllData("DCP", "assignment")
            ]);

            if (activeDispatchRef.current !== dispatchId) {
                return;
            }

            // await dispatch(getAssignmentByGuidWithoutViewScopeAndQuestionnaire({
            //     pAssignmentGuid: id,
            //     pStaffUid: user.id,
            //     pStaffPositionUid: user.stf_position,
            // })
            // )
            //     .unwrap()
            //     .then(async (action) => {
            //         const fetchAssignmentData = async () => {
            //             const result = getAllData("DCP", "assignment").then(
            //                 (data) => {
            //                     return data;
            //                 }
            //             );
            //             return result;
            //         };

                    // const assignmentList = await fetchAssignmentData();
                    // const { assignment, questionnaire, enquiryLog, hhContact, eFieldCard, segmentControl, rule } = action.data;
                    const { assignment, enquiryLog, hhContact, eFieldCard, segmentControl } = action.payload.data;
                    // const maxDate = moment.max(assignment.AppointmentBookingObject?.map(maxAppoint => moment(maxAppoint.APPT_DT_STRT)))
                    // const maxAppointment = assignment.AppointmentBookingObject?.find(appointment =>
                    //     moment(appointment.APPT_DT_STRT).isSame(maxDate)
                    // )

                    //Handle Prefill
                    // const assignmentPrefill = questionnaire?.dataPrefill?.filter(item => item.FLD_TYP == 'O').map(item => ({
                    //     FLD_NAME: item.FLD_NAME,
                    //     FLD_VAL: [assignment[item.FLD_NAME_SRC]]
                    // })) ?? []

                    // const lastRoundData = JSON.parse(assignment?.lastRoundSubmission?.find(item => item.Form_ID == assignment.TEMP_DOC_REF_NO)?.Submission_FormIo ?? null)
                    // const questionnairePrefill = lastRoundData ? questionnaire?.dataPrefill?.filter(item => item.FLD_TYP == 'Q').map(item => {
                    //     const result = getAllValuesByKey(lastRoundData, item.FLD_NAME_SRC)
                    //     return {
                    //         FLD_NAME: item.FLD_NAME,
                    //         FLD_VAL: result,
                    //     }

                    // }) ?? [] : []

                    // await dispatch(updateQuestionnaireState({
                    //     key: 'lastRoundData',
                    //     value: lastRoundData?.[0] ?? null

                    // }))
                    let mergedAssignment = {
                        ...assignment,
                        English_Full_Address: [assignment.MAIL_ADDR_ENG_1, assignment.MAIL_ADDR_ENG_2, assignment.MAIL_ADDR_ENG_3, assignment.MAIL_ADDR_ENG_4, assignment.MAIL_ADDR_ENG_5, assignment.MAIL_ADDR_ENG_6,].filter((add) => add && add != "").join(", ") /*+ ", " + assignment.DCCA_ENG*/,
                        Chinese_Full_Address: [assignment.MAIL_ADDR_CHI_1, assignment.MAIL_ADDR_CHI_2, assignment.MAIL_ADDR_CHI_3, assignment.MAIL_ADDR_CHI_4, assignment.MAIL_ADDR_CHI_5, assignment.MAIL_ADDR_CHI_6,].filter((add) => add && add != "").join(", "),
                        LQ_Address: assignment.MAIL_ADDR_ENG_1 + " " + assignment.DCCA_ENG,
                        GUID: assignment.GUID ? assignment.GUID : uuid(),
                        AppointmentBookingObject: assignment.AppointmentBookingObject?.map((appoint) => {
                            return {
                                ...appoint,
                                ASGN_GUID: assignment.GUID,
                            };
                        }
                        ),
                        FETCH_DATE: moment().toISOString(true),
                        BLDG_TYPE_WITH_DESC: [assignment.BLDG_TYP, assignment.BT_DESCR].filter((content) => content && content !== "").join(" - ")
                    };

                    // handleAssignmentData(mergedAssignment, questionnaire, enquiryLog, hhContact, assignmentList);
                    let assignmentData = handleAssignmentData(mergedAssignment, undefined, enquiryLog, hhContact, assignmentList);

                   
                    //  [20250407] enable users to take action on screen while assignment detail is ready.
                    setIsLoading(false);
  
                    // [20250407] handle questionnaire data as background tasks while online.

                    const response = await dispatch(getAssignmentByGuidWithoutViewScope({
                        pAssignmentGuid: id,
                        pStaffUid: user.id,
                        pStaffPositionUid: user.stf_position,
                    })).unwrap();

                    if (activeDispatchRef.current !== dispatchId) {
                        return;
                    }

                    const { assignment: fullAssignment, questionnaire, rule } = response.data;
                    mergedAssignment = {
                        ...mergedAssignment,
                        submission: fullAssignment.submission,
                        indoorSubmission: fullAssignment.indoorSubmission,
                        followupSubmission: fullAssignment.followupSubmission,
                        fieldSubmission: fullAssignment.fieldSubmission,
                        lastRoundSubmission:fullAssignment.lastRoundSubmission,
                        FU_Q_DATA_VER_NO:fullAssignment.FU_Q_DATA_VER_NO,
                        QualityControlLogObject: fullAssignment.QualityControlLogObject,
                    }

                    if (!skipOfflineSync) {
                        await pAddData("DCP", "assignment", [mergedAssignment], "GUID", false, dbc, user);
                    }

                    if(fullAssignment.lastRoundSubmission){
                        assignmentData = {
                            ...assignmentData,
                            lastRoundSubmission:fullAssignment.lastRoundSubmission,
                            FU_Q_DATA_VER_NO:fullAssignment.FU_Q_DATA_VER_NO,
                            QualityControlLogObject: fullAssignment.QualityControlLogObject,
                        }
                    }

                    assignmentData = {
                        ...assignmentData,
                        submission: fullAssignment.submission,
                        indoorSubmission: fullAssignment.indoorSubmission,
                        followupSubmission: fullAssignment.followupSubmission,
                        fieldSubmission: fullAssignment.fieldSubmission,
                    }                    
                    
                    handleQuestionnaireData(assignmentData, questionnaire, fullAssignment.submission);

                    if (questionnaire) {
                        let tempRecord = {
                            questionnaire: questionnaire,
                            GUID: assignment?.TEMP_DOC_REF_NO + "_" + assignment?.TMPL_VLD_VER_NO,
                            DOC_REF_NO: assignment?.TEMP_DOC_REF_NO,
                            SRVY_UID: assignment?.SRVY_UID,
                            rule: rule,
                        };

                        if (!skipOfflineSync) {
                            await pAddData("DCP", "questionnaire", [tempRecord], "DOC_REF_NO", false, dbc, user);
                        }
                        setIsQuestionnaireDataReady(true);
                        tempRecord = null;
                    }

                    if (!skipOfflineSync) {
                        await pAddData("DCP", "enquiryLog", enquiryLog, "GUID", false, dbc, user);
                        await pAddData("DCP", "hhContact", hhContact, "GUID", false, dbc, user);
                        // addData('DCP', 'hhContact', hhContact, 'GUID', false);
                        await pAddData("DCP", "segmentControl", [{ ...segmentControl, GUID: segmentControl?.SEG_UID + "_" + segmentControl?.SC_UID, },], "GUID", false, dbc, user);
                    }

                    if (eFieldCard) {
                        let temp = {
                            ...eFieldCard,
                            English_Full_Address: [eFieldCard.MAIL_ADDR_ENG_1, eFieldCard.MAIL_ADDR_ENG_2, eFieldCard.MAIL_ADDR_ENG_3, eFieldCard.MAIL_ADDR_ENG_4, eFieldCard.MAIL_ADDR_ENG_5, eFieldCard.MAIL_ADDR_ENG_6,].filter((add) => add && add != "").join(", "),
                            Chinese_Full_Address: [eFieldCard.MAIL_ADDR_CHI_1, eFieldCard.MAIL_ADDR_CHI_2, eFieldCard.MAIL_ADDR_CHI_3, eFieldCard.MAIL_ADDR_CHI_4, eFieldCard.MAIL_ADDR_CHI_5, eFieldCard.MAIL_ADDR_CHI_6,].filter((add) => add && add != "").join(", "),
                            LQ_Address: eFieldCard.MAIL_ADDR_ENG_2 + " " + eFieldCard.MAIL_ADDR_ENG_3 + eFieldCard.MAIL_ADDR_ENG_4,
                            GUID: eFieldCard.GUID ? eFieldCard.GUID : uuid(),
                            EFieldCardContactObject: eFieldCard.EFieldCardContactObject ? eFieldCard.EFieldCardContactObject : [],
                            EFieldCardSegmentImageObject: eFieldCard.EFieldCardSegmentImageObject ? eFieldCard.EFieldCardSegmentImageObject : [],
                            EFieldCardSpecificInfoObject: eFieldCard.EFieldCardSpecificInfoObject.map((specInfo) => ({
                                ...specInfo,
                                GUID: specInfo.GUID
                                    ? specInfo.GUID
                                    : uuid(),
                            })),
                        };
                        if (!skipOfflineSync) {
                            await pAddData("DCP", "eFieldCard", [temp], "GUID", false, dbc, user);
                        }
                        temp = null;
                    }
                // })
        } catch (e) {
            setIsLoading(true);
            await getAllData('DCP', 'assignment').then(assignmentList => {
                getAllData('DCP', 'questionnaire').then(questionnaireList => {
                    getAllData('DCP', 'enquiryLog').then(enquiryLogList => {
                        getAllData('DCP', 'hhContact').then(contactList => {
                            const assignment = assignmentList?.find(assign => assign.GUID == id)
                            if (assignment) {
                                const questionnaire = questionnaireList.find(ques =>
                                    ques?.GUID == `${assignment?.TEMP_DOC_REF_NO}_${assignment?.TMPL_VLD_VER_NO}` &&
                                    (ques.SRVY_UID == assignment?.SRVY_UID || ques.questionnaire.SRVY_UID == assignment?.SRVY_UID)
                                )?.questionnaire

                                let mergedAssignment = {
                                    ...assignment,
                                    English_Full_Address: [assignment.MAIL_ADDR_ENG_1, assignment.MAIL_ADDR_ENG_2, assignment.MAIL_ADDR_ENG_3, assignment.MAIL_ADDR_ENG_4, assignment.MAIL_ADDR_ENG_5, assignment.MAIL_ADDR_ENG_6,].filter((add) => add && add != "").join(", ") /*+ ", " + assignment.DCCA_ENG*/,
                                    Chinese_Full_Address: [assignment.MAIL_ADDR_CHI_1, assignment.MAIL_ADDR_CHI_2, assignment.MAIL_ADDR_CHI_3, assignment.MAIL_ADDR_CHI_4, assignment.MAIL_ADDR_CHI_5, assignment.MAIL_ADDR_CHI_6,].filter((add) => add && add != "").join(", "),

                                    LQ_Address: `${assignment.MAIL_ADDR_ENG_1} ${assignment.DCCA_ENG}`,
                                    GUID: assignment.GUID ? assignment.GUID : uuid(),
                                    AppointmentBookingObject: assignment.AppointmentBookingObject?.map((appoint) => ({
                                        ...appoint,
                                        ASGN_GUID: assignment.GUID,
                                    })),
                                    FETCH_DATE: moment().toISOString(true),
                                    BLDG_TYPE_WITH_DESC: [assignment.BLDG_TYP, assignment.BT_DESCR].filter((content) => content && content !== "").join(" - ")
                                };

                                // const offlineContentList = contactList.filter(item => item.HH_CONT_UID == null)
                                handleAssignmentData(mergedAssignment, questionnaire, enquiryLogList, contactList, assignmentList);
                                mergedAssignment = null;
                                setIsQuestionnaireDataReady(true);
                                setIsLoading(false);
                            }
                        });
                    });
                });
            });
        } finally {
            localStorage.removeItem("skipOfflineSync");
            if (activeDispatchRef.current === dispatchId) {
                activeDispatchRef.current = null;
            }
        }
    };

    const getSubForm = (questionnaire) => {
        return (Utils.searchComponents(questionnaire.components, { type: "form", }) ?? []);
    };

    useEffect(() => {
        // loadingHandler(dispatchData, setIsLoading);
        if(dbc == null) return;
        setIsQuestionnaireDataReady(false);
        dispatchData();
    }, [needFetch, dbc]);

    useEffect(() => {
        if (props.approverList) {
            setApproverList(props.approverList?.find((item) => item.STF_POSN_UID == user.stf_position).Supervisor.flatMap((item) => {
                // const delegates = delegatedAssignmentApproverList?.find((del) => del.STF_POSN_UID == user.stf_position)?.ApproverList?.map((aprv) => {
                //     if (aprv.DELG_STF_UID_FRM == item.STF_UID)
                //         return { ...aprv, GUID: `${aprv.STF_UID}_${aprv.POSN_UID}`, };
                //     return null;
                // }).filter(Boolean)

                // if (delegates?.length) {
                //     return [item, ...delegates];
                // }
                return [item];
            }).filter((value, index, self) => self.indexOf(value) === index));
        }
    }, [props.approverList, user.stf_position]);

    const handleAssignmentData = (assignment, questionnaire, enquiryLogList, contactList, assignmentList) => {
        let tempData = Object.assign({}, assignment);

        //Handle Prefill
        let assignmentPrefillSource = {
            ...tempData,
            ...(tempData?.AssignmentDetailObject?.[0] ?? {}),
            ...{ SDU_IND: tempData.SDU_IND?.toString() },
        };
        let subFormList = questionnaire ? getSubForm(questionnaire) : [];
        let combinedPrefillList = [
            ...(questionnaire?.dataPrefill ?? []),
            ...subFormList.flatMap((form) => form.dataPrefill ?? []),
        ];
        let staffDataPrefill = combinedPrefillList?.filter((item) => item.FLD_TYP == "S").map((item) => {
            const answerSource =
                user[item.FLD_NAME_SRC] ;
            return {
                FLD_NAME: item.FLD_NAME,
                FLD_VAL: [answerSource],
                FLD_TYP: "S",
            };
        }) ?? [];
        let assignmentPrefill =
            combinedPrefillList
                ?.filter((item) => item.FLD_TYP == "O")
                .map((item) => {
                    const answerSource =
                        assignmentPrefillSource[item.FLD_NAME_SRC] === 0
                            ? assignmentPrefillSource[
                                item.FLD_NAME_SRC
                            ].toString()
                            : assignmentPrefillSource[item.FLD_NAME_SRC];
                    return {
                        FLD_NAME: item.FLD_NAME,
                        FLD_VAL: [assignmentPrefillSource[item.FLD_NAME_SRC]],
                         //FLD_VAL: [answerSource],
                        FLD_TYP: "O",
                    };
                }) ?? [];
        let lastRoundData = JSON.parse(
            tempData?.lastRoundSubmission?.find(
                (item) => item.Form_ID == tempData.TEMP_DOC_REF_NO
            )?.Submission_FormIo ?? null
        );

        let countPP = null;
        if(lastRoundData && Array.isArray(lastRoundData) && lastRoundData[0] && lastRoundData[0].PPcontainer1 && lastRoundData[0].PPcontainer1.PP){
            countPP = lastRoundData[0].PPcontainer1.PP.length
        }
        let questionnairePrefill = lastRoundData ? combinedPrefillList?.filter((item) => item.FLD_TYP == "Q").map((item) => {
            const result = getAllValuesByKey(
                lastRoundData,
                item.FLD_NAME_SRC
            );
            return {
                FLD_NAME: item.FLD_NAME,
                FLD_VAL: (countPP && result.length > countPP) ? result.slice(0, countPP) : result,
                FLD_TYP: "Q",
            };
        }) ?? [] : [];

        tempData.prefillList = [
            ...(tempData?.AdminDataPrefillObject ?? []),
            ...assignmentPrefill,
            ...questionnairePrefill,
            ...staffDataPrefill
        ];
        dispatch(
            updateQuestionnaireState({
                key: "lastRoundData",
                value: lastRoundData?.[0] ?? null,
            })
        );

        tempData.InterviewLogListObject = tempData?.InterviewLogListObject?.map((interviewLog) => {
            const interviewLogContact = contactList.find((contact) => contact.GUID == interviewLog.HH_CONT_GUID);
            // const sameRespondantContact = contactList.filter(contact => contact.LINK_ID == interviewLogContact?.LINK_ID);
            // const filteredAssignmentList = assignmentList.filter(assign => assign.GUID != id && assign.ContactObject.some(assignContact => sameRespondantContact.some(sameRespon => sameRespon.GUID == assignContact.GUID)));
            const filteredAssignmentList = assignmentList.filter((assign) => interviewLogContact?.LINK_ID_LST?.some((sameRespon) => sameRespon == assign.GUID));
            return {
                ...interviewLog,
                LINK_ID_LST: filteredAssignmentList.map((assign) => assign.GUID),
            };
        }) ?? [];

        //apply empty array for error list and follow up list are not provided case
        if (questionnaire) {
            tempData.FormLanguageObject = questionnaire;
            let subformList = getSubForm(questionnaire);
            tempData.FormLanguageObject.Error_List = [
                ...questionnaire.Error_List,
                ...subformList.flatMap(({ Error_List = [], form }) => Error_List?.map((item) => ({ ...item, Form_Id: form }))
                ),
                //...subformList.flatMap(({ Error_List, form }) => Error_List.map(item => ({ ...item, Form_Id: form }))),
            ];
            tempData.FormLanguageObject.FollowUp_List = [
                ...questionnaire.FollowUp_List,
                ...subformList.flatMap(({ FollowUp_List = [], form }) => FollowUp_List?.map((item) => ({ ...item, Form_Id: form }))
                ),
            ];
            subformList = null;
        }

        tempData.ASGN_STS_DESCR = assignmentStatusList.find((item) => item.value == tempData.ASGN_STS)?.label;
        tempData.INTV_MDE_DESCR = interviewModeList.find((item) => item.value == tempData.LST_APPT_INTV_MDE)?.label;
        setTableContent(tempData);
        setNeedEOE(!!tempData.EOE_RSN_CD);

        let tempContactList = contactList?.filter((contact) => contact.ASGN_GUID == assignment?.GUID)?.map((contact) => {
            // const tempContactList = contactList?.filter(contact => assignment.ContactObject.some(seq => seq.GUID == contact.GUID)).map(contact => {
            // const sameRespondantContact = contactList.filter(sameRespon => contact.LINK_ID && sameRespon.LINK_ID == contact.LINK_ID);
            // const filteredAssignmentList = assignmentList.filter(assign => assign.GUID != id && assign.ContactObject.some(assignContact => sameRespondantContact.some(sameRespon => sameRespon.GUID == assignContact.GUID)));
            const filteredAssignmentList = assignmentList.filter((assign) => contact?.LINK_ID_LST?.some((sameRespon) => sameRespon == assign.GUID));
            return {
                ...contact,
                RESPT_ASGN_LST: filteredAssignmentList.map((assign) => assign.ASGN_REF_NO).join(", "),
            };
        });

        setContactList(tempContactList);

        let filteredEnquiryLog = enquiryLogList?.filter((enquiry) => assignment?.EnquiryLogObject?.some((seq) => seq.GUID == enquiry.GUID));

        let tempEnquiryLog = filteredEnquiryLog?.map((enquiry) => {
            return {
                ...enquiry,
                CONT_NAME_ENG: enquiry.HH_CONT_GUID
                    ? contactList?.find(
                        (item) => item["GUID"] == enquiry.HH_CONT_GUID
                    )?.NAME_ENG
                    : null,
                CONT_NAME_CHI: enquiry.HH_CONT_GUID
                    ? contactList?.find(
                        (item) => item["GUID"] == enquiry.HH_CONT_GUID
                    )?.NAME_CHI
                    : null,
                CONT_TEL_1: enquiry.HH_CONT_GUID
                    ? contactList?.find(
                        (item) => item["GUID"] == enquiry["HH_CONT_GUID"]
                    )?.TEL_1
                    : null,
                CONT_TEL_EXT_1: enquiry.HH_CONT_GUID
                    ? contactList?.find(
                        (item) => item["GUID"] == enquiry["HH_CONT_GUID"]
                    )?.TEL_EXT_1
                    : null,
                CONT_TEL_2: enquiry.HH_CONT_GUID
                    ? contactList?.find(
                        (item) => item["GUID"] == enquiry["HH_CONT_GUID"]
                    )?.TEL_2
                    : null,
                CONT_TEL_EXT_2: enquiry.HH_CONT_GUID
                    ? contactList?.find(
                        (item) => item["GUID"] == enquiry["HH_CONT_GUID"]
                    )?.TEL_EXT_2
                    : null,
                CONT_TITL: enquiry.HH_CONT_GUID
                    ? contactList?.find(
                        (item) => item["GUID"] == enquiry["HH_CONT_GUID"]
                    )?.TITL
                    : null,
                STRT_TM: moment(enquiry.STRT_DT)
                    .date(moment().date())
                    .month(moment().month())
                    .year(moment().year())
                    .toISOString(true),
                CONT_EML: enquiry.HH_CONT_GUID
                    ? contactList?.find(
                        (item) => item["GUID"] == enquiry["HH_CONT_GUID"]
                    )?.EML
                    : null,
            };
        });
        setEnquiryLogList(tempEnquiryLog);

        let tempAppointmentList = assignment?.AppointmentBookingObject?.map(
            (appoint) => {
                return {
                    ...appoint,
                    CONT_NAME_ENG: appoint.HH_CONT_GUID
                        ? contactList?.find(
                            (item) => item["GUID"] == appoint.HH_CONT_GUID
                        )?.NAME_ENG
                        : null,
                    CONT_NAME_CHI: appoint.HH_CONT_GUID
                        ? contactList?.find(
                            (item) => item["GUID"] == appoint.HH_CONT_GUID
                        )?.NAME_CHI
                        : null,
                    CONT_TEL_1: appoint.HH_CONT_GUID
                        ? contactList?.find(
                            (item) => item["GUID"] == appoint["HH_CONT_GUID"]
                        )?.TEL_1
                        : null,
                    CONT_TEL_EXT_1: appoint.HH_CONT_GUID
                        ? contactList?.find(
                            (item) => item["GUID"] == appoint["HH_CONT_GUID"]
                        )?.TEL_EXT_1
                        : null,
                    CONT_TEL_2: appoint.HH_CONT_GUID
                        ? contactList?.find(
                            (item) => item["GUID"] == appoint["HH_CONT_GUID"]
                        )?.TEL_2
                        : null,
                    CONT_TEL_EXT_2: appoint.HH_CONT_GUID
                        ? contactList?.find(
                            (item) => item["GUID"] == appoint["HH_CONT_GUID"]
                        )?.TEL_EXT_2
                        : null,
                    CONT_TITL: appoint.HH_CONT_GUID
                        ? contactList?.find(
                            (item) => item["GUID"] == appoint["HH_CONT_GUID"]
                        )?.TITL
                        : null,
                    CONT_EML: appoint.HH_CONT_GUID
                        ? contactList?.find(
                            (item) => item["GUID"] == appoint["HH_CONT_GUID"]
                        )?.EML
                        : null,
                };
            }
        );
        setAppointmentList(tempAppointmentList);
        setAssignmentList(assignmentList);

        if (needCursory) {
            handleApprovewithQC(tempData);
            dispatch(
                updateQuestionnaireState({
                    key: "needCursory",
                    value: false,
                })
            );
        }

        //  When it is online, since questionniare data requires to handle in background task, need to return tempData
        if(localStorage.getItem("IS_ONLINE") == "true") {
            return tempData;
        }

        tempData = null;
        assignmentPrefillSource = null;
        subFormList = null;
        combinedPrefillList = null;
        assignmentPrefill = null;
        lastRoundData = null;
        questionnairePrefill = null;
        tempContactList = null;
        filteredEnquiryLog = null;
        tempEnquiryLog = null;
        tempAppointmentList = null;
        staffDataPrefill = null;
    };

    const handleQuestionnaireData = (tempData, questionnaire, submission) => {
        let assignmentPrefillSource = {
            ...tempData,
            ...(tempData?.AssignmentDetailObject?.[0] ?? {}),
            ...{ SDU_IND: tempData.SDU_IND },
        };

        let subFormList = questionnaire ? getSubForm(questionnaire) : [];
        let combinedPrefillList = [...(questionnaire?.dataPrefill ?? []), ...subFormList.flatMap((form) => form.dataPrefill ?? []),];
        let assignmentPrefill = combinedPrefillList?.filter((item) => item.FLD_TYP == "O").map((item) => {
            const answerSource =
                assignmentPrefillSource[item.FLD_NAME_SRC] === 0 ? assignmentPrefillSource[item.FLD_NAME_SRC].toString()
                    : assignmentPrefillSource[item.FLD_NAME_SRC];
            return {
                FLD_NAME: item.FLD_NAME,
                FLD_VAL: [answerSource],
                FLD_TYP: "O",
            };
        }) ?? [];
        let lastRoundData = JSON.parse(tempData?.lastRoundSubmission?.find((item) => item.Form_ID == tempData.TEMP_DOC_REF_NO)?.Submission_FormIo ?? null);
        let countPP = null;
        if(lastRoundData && Array.isArray(lastRoundData) && lastRoundData[0] && lastRoundData[0].PPcontainer1 && lastRoundData[0].PPcontainer1.PP){
            countPP = lastRoundData[0].PPcontainer1.PP.length
        }
        let questionnairePrefill = lastRoundData ? combinedPrefillList?.filter((item) => item.FLD_TYP == "Q").map((item) => {
            const result = getAllValuesByKey(
                lastRoundData,
                item.FLD_NAME_SRC
            );
            return {
                FLD_NAME: item.FLD_NAME,
                FLD_VAL: (countPP && result.length > countPP) ? result.slice(0, countPP) : result,
                FLD_TYP: "Q",
            };
        }) ?? [] : [];

        tempData.prefillList = [
            ...(tempData?.AdminDataPrefillObject ?? []),
            ...assignmentPrefill,
            ...questionnairePrefill,
        ];

        //apply empty array for error list and follow up list are not provided case
        if (questionnaire) {
            tempData.FormLanguageObject = questionnaire;
            let subformList = getSubForm(questionnaire);
            tempData.FormLanguageObject.Error_List = [
                ...questionnaire.Error_List,
                ...subformList.flatMap(({ Error_List = [], form }) => Error_List?.map((item) => ({ ...item, Form_Id: form }))
                ),
                //...subformList.flatMap(({ Error_List, form }) => Error_List.map(item => ({ ...item, Form_Id: form }))),
            ];
            tempData.FormLanguageObject.FollowUp_List = [
                ...questionnaire.FollowUp_List,
                ...subformList.flatMap(({ FollowUp_List = [], form }) => FollowUp_List?.map((item) => ({ ...item, Form_Id: form }))
                ),
            ];
            subformList = null;
        }
        tempData.submission = submission;
        setTableContent(tempData);

        if (needCursory) {
            handleApprovewithQC(tempData);
        }
    }

    const basicStatusList = [
        {
            label: "Yes",
            value: "Y",
        },
        {
            label: "No",
            value: "N",
        },
    ];

    const tableStructure_general = [
        {
            header: "Survey",
            inputType: "custome",
            key: "SRVY_NAME_ENG",
            cell: (content) =>
                `${content.SRVY_CD ?? ""} / ${content.SRVY_NAME_ENG ?? ""}`,
            isMinW: true,
        },
        {
            header: "Survey Round",
            inputType: "text",
            key: "SRVY_CYCLE_CODE",
        },
        {
            header: "Appointment Mode (latest)",
            inputType: "text-select",
            key: "LST_APPT_INTV_MDE",
            list: interviewModeList,
            targetKey: "value",
            contentKey: "LST_APPT_INTV_MDE",
            displayKey: "label",
        },
        {
            header: "Appointment Date (latest)",
            inputType: "date-time",
            key: "LST_APPT_DT_NEW",
        },
        {
            header: "Asgn. Ref.",
            inputType: "text",
            key: "ASGN_REF_NO",
        },
        {
            header: "Asgn. Status",
            inputType: "text",
            key: "ASGN_STS_DESCR",
        },
        {
            header: "OQ Reg. Ind. & OQ Reg. Date",
            inputType: "custome",
            cell: (content) => {
                return `${basicStatusList.find(
                    (item) => item.value == content.OQ_ACCT_IND
                )?.label ?? ""
                    } / ${content.OQ_ACCT_IND === basicStatusList[0].value
                        ? !content.REG_DT
                            ? "-"
                            : moment(content.REG_DT).format("y-MM-DD")
                        : "-"
                    }`;
            },
        },
        {
            header: "Visit / Return Mode",
            inputType: "custome",
            key: "DC_RTN_MDE_DESCR",
            cell: (content) =>
                content.AssignmentDetailObject?.[0]?.DC_RTN_MDE_DESCR ?? "-",
        },
        {
            header: "Enum. Status",
            inputType: "custome",
            list: enumResultList,
            contentKey: "ENUM_RSLT_CD",
            cell: (content) => {
                return (
                    <React.Fragment>
                        <>
                            {isEditStatus ? (
                                <SearchableSelect
                                    value={enumResultList?.map((option) => {
                                        if (
                                            content.ENUM_RSLT_CD == option.value
                                        )
                                            return option;
                                    })}
                                    options={[
                                        { label: " ", value: "" },
                                        ...enumResultList,
                                    ]}
                                    onChange={(e) => {
                                        onChangeTableContent(
                                            "ENUM_RSLT_CD",
                                            e.value,
                                            null
                                        );
                                    }}
                                    className="multi-select"
                                    isDisabled={!isEditStatus}
                                />
                            ) : (
                                content.ENUM_RSLT_CD_DESCR
                            )}
                        </>
                        {isEditStatus ? (
                            <div className="grey_icon_wrapper">
                                <Tooltip label="Save">
                                    <div
                                        className="icon_save"
                                        onClick={onSaveStatus}
                                    />
                                </Tooltip>
                                <Tooltip label="Cancel">
                                    <div
                                        className="icon_cancel_edit"
                                        onClick={onCancelStatus}
                                    />
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="grey_icon_wrapper">
                                <Tooltip label="Edit">
                                    <div
                                        className={`icon_edit_1`}
                                        onClick={onEditStatus}
                                    />
                                </Tooltip>
                            </div>
                        )}
                    </React.Fragment>
                );
            },
        },
        {
            header: "Visual Alerts",
            // header: 'Visual Alerts / Indicators',
            inputType: "custome",
            key: "visual_alerts",
            cell: (content) => {
                let vaContent = [];
                content.AssignmentDetailObject?.[0]?.RemarkList?.length > 0 &&
                    vaContent.push({
                        key: "va_r",
                        value: "r",
                        display_name: "R",
                        tooltip: "Asgn. Remarks",
                    });
                content.NFA_IND == "Y" &&
                    vaContent.push({
                        key: "va_a",
                        value: "a",
                        display_name: "NFA",
                        tooltip: "No Further Action",
                    });
                content.NFV_IND == "Y" &&
                    vaContent.push({
                        key: "va_v",
                        value: "v",
                        display_name: "NFV",
                        tooltip: "No Field Visit",
                    });
                content.HLD_STS == "H" &&
                    vaContent.push({
                        key: "va_h",
                        value: "h",
                        display_name: "H",
                        tooltip: "Hold",
                    });
                content.DF_HDL_STS == "I" &&
                    vaContent.push({
                        key: "va_c",
                        value: "c",
                        display_name: "C",
                        tooltip: "Data Conflict",
                    });
                content.DLREC_STS == "A" &&
                    vaContent.push({
                        value: 'of_t',
                        display_name:'of_t',
                        tooltip: 'Offline Record'
                    });
                content.SubmissionVersionObject?.find(
                    (item) => item.RVW_STS == "P"
                ) &&
                    vaContent.push({
                        key: "va_re",
                        value: "re",
                        display_name: "RE",
                        tooltip: "Review questionnaire visual alert",
                    });
                content.BKM_RMKS != null &&
                    content.BKM_RMKS != "" &&
                    vaContent.push({
                        key: "va_b",
                        value: "b",
                        display_name: "B",
                        tooltip: "Bookmarked",
                    });
                content.AssignmentDetailObject?.[0]?.LST_RND_RMKS_IND == 'Y' &&
                    vaContent.push({
                        key: 'r_lr',
                        value: 'r_lr',
                        display_name: 'RLR',
                        tooltip: 'Last Round Remarks'
                    })
                // content.ASGN_PRTY && vaContent.push({ value: 'priority' })
                // content.RFSL_IND == "R" && vaContent.push({ value: 'refusal' })
                // content.repeat == "I" && vaContent.push({ value: 'repeat' })
                // content.HR_IND && vaContent.push({ value: 'hr' })
                // content.remark == "I" && vaContent.push({ value: 'remark' })
                // content.del == "I" && vaContent.push({ value: 'del' })
                // content.PAIR_VST_IND == "M" && vaContent.push({ value: 'pairvisit' })
                // content.BMO_LTR_IND == "I" && vaContent.push({ value: 'bmo' })
                // content.seasrch == "I" && vaContent.push({ value: 'seasrch' })
                // content.split == "I" && vaContent.push({ value: 'split' })
                // content.lift == "I" && vaContent.push({ value: 'lift' })
                // content.merger == "I" && vaContent.push({ value: 'merger' })
                // content.sdu == "I" && vaContent.push({ value: 'sdu' })
                // content.sketch == "I" && vaContent.push({ value: 'sketch' })
                // content.emptyplot == "I" && vaContent.push({ value: 'emptyplot' })
                // content.SEG_KEY_CASE == "y" && vaContent.push({ value: 'segmentcase' })
                // content.BKM == "Y" && vaContent.push({ value: 'bkm' })
                // content.OQ_ACCT_IND == "Y" && vaContent.push({ value: 'oqcase' })
                // content.attachment == "I" && vaContent.push({ value: 'attachment' })

                return (
                    vaContent?.length > 0 && (<div className="fieldContainer vaiconList">
                        {
                            vaContent?.map((vaicon) => (
                                <div key={vaicon.key}>
                                    {vaicon.tooltip ? (<Tooltip label={vaicon.tooltip}>
                                        <div className={`tooltip icon_va_${vaicon.value}`}  ></div>
                                    </Tooltip>
                                    ) : (
                                        <div>{vaicon.value}</div>
                                    )}
                                </div>
                            ))
                        }
                    </div>
                    )
                );
            },
        },
        {
            header: "Asgn. Source",
            inputType: "text",
            key: "ASGN_SRC",
        },
        {
            header: "Asgn. Created Date",
            inputType: "custome",
            key: "CRE_DT",
            cell: (content) => content.AssignmentDetailObject?.[0]?.CRE_DT && moment(content.AssignmentDetailObject?.[0]?.CRE_DT).format("y-MM-DD"),
        },
        {
            header: "Bookmark",
            inputType: "custome",
            key: "BKM_RMKS",
            cell: (content) => {
                return (
                    <React.Fragment key={"BKM_RMKS_TEXT"}>
                        <Textarea
                            onChange={(e) => {
                                onChangeTableContent("BKM_RMKS", e.target.value, null);
                            }}
                            value={content.BKM_RMKS ?? ""}
                            maxLength={500}
                            isDisabled={!isEdit}
                        />
                        {isEdit ? (
                            <div className="grey_icon_wrapper">
                                <Tooltip label="Save">
                                    <div className="icon_save" onClick={onSaveDetail} />
                                </Tooltip>
                                <Tooltip label="Cancel">
                                    <div className="icon_cancel_edit" onClick={onCancelRemarks} />
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="grey_icon_wrapper">
                                <Tooltip label="Edit">
                                    <div className={`icon_edit_1`} onClick={onEditRemarks} />
                                </Tooltip>
                            </div>
                        )}
                    </React.Fragment>
                );
            },
        },
    ];

    const refuse_structure = [
        {
            header: "Refusal Ind.",
            inputType: "select",
            key: "RFSL_IND",
            list: assignRefuseIndList,
        },
        {
            header: 'Refusal Level',
            inputType: 'select',
            key: 'RFSL_LVL',
            list: assignRefuseLvlList,
            isDisabled: tableContent.RFSL_IND != "R",
        },
    ];

    const activity_tableStructure = [
        {
            header: "Type",
            inputType: "text",
            key: "ACTY_TYP_DESCR_ENG",
        },
        {
            header: "Description",
            inputType: "text",
            key: "OTH_DESCR",
        },
        {
            header: 'Created Date',
            inputType: 'text-date-time',
            key: 'CRE_DT',
        },
        {
            header: "Created By",
            inputType: "text",
            key: "CRE_BY_NAME_ENG",
        },
    ];

    const qctForm_structure = [
        {
            header: "Calls/Visits of Day",
            inputType: "input",
            key: "field3",
        },
        {
            header: "Calls/Visits of Night",
            inputType: "input",
            key: "field4",
        },
        {
            header: "Module of QC (F/T)",
            inputType: "input",
            key: "field5",
        },
        {
            header: "Result of QC*",
            inputType: "input",
            key: "field6",
        },
        {
            header: "Detail of inconsistency (if any)/ Remarks",
            inputType: "input",
            key: "field7",
        },
        {
            header: "Major Mistake",
            inputType: "input",
            key: "field8",
        },
        {
            header: "Minor Mistake",
            inputType: "input",
            key: "field9",
        },
    ];

    const mistakeStructure = [
        {
            header: "Mistake Type",
            inputType: "select",
            key: "MIST_TYP",
            list: codingEditingMistakeList,
            isDisabled: tableContent.ASGN_STS !== "CMP" && (!user.isCET || (tableContent.ASGN_STG_IND != "C" && tableContent.ASGN_STG_IND != "PC")),
        },
        {
            header: "Remarks",
            inputType: "custome",
            key: "MIST_TYP_RMKS",
            isDisabled: tableContent.ASGN_STS !== "CMP" && (!user.isCET || (tableContent.ASGN_STG_IND != "C" && tableContent.ASGN_STG_IND != "PC")),
            cell: (content) => {
                return (
                    <>
                        <Textarea
                            value={content.MIST_TYP_RMKS ?? ""}
                            maxLength={500}
                            isDisabled={tableContent.ASGN_STS !== "CMP" && (!user.isCET || (tableContent.ASGN_STG_IND != "C" && tableContent.ASGN_STG_IND != "PC"))}
                            onChange={onMistakeChange}
                        />
                    </>
                );
            },
        },
    ];

    const onMistakeChange = ({ target: { value } }) => {
        setTableContent(content => ({
            ...content,
            MIST_TYP_RMKS: value,
        }))
    }

    const EOEStructure = [
        {
            header: "Submit as EOE",
            inputType: "custome",
            cell: (content) => (
                <Checkbox
                    variant="circular"
                    isChecked={needEOE}
                    isDisabled={
                        tableContent.ASGN_STS != "PE" && tableContent.ASGN_STS != "EIP" &&
                        tableContent.ASGN_STS != "PFU" && tableContent.ASGN_STS != "FUI" &&
                        tableContent.ASGN_STS != "PPFU" && tableContent.ASGN_STS != "PFUI"
                    }
                    onChange={(e) => {
                        setTableContent((c) => ({
                            ...c,
                            EOE_RSN_CD: "",
                        }));
                        setNeedEOE(e.target.checked);
                    }}
                />
            ),
        },
        {
            header: "Reason",
            inputType: "select",
            key: "EOE_RSN_CD",
            list: EndOfEnumerationReasonCodeList?.filter((item) => item.SRVY_UID == tableContent.SRVY_UID).map((item) => ({ value: item.RSN_CD, label: item.RSLT_DESCR, })) ?? [],
            isDisabled: !needEOE || (tableContent.ASGN_STS != "PE" && tableContent.ASGN_STS != "EIP" &&
                tableContent.ASGN_STS != "PFU" && tableContent.ASGN_STS != "FUI" &&
                tableContent.ASGN_STS != "PPFU" && tableContent.ASGN_STS != "PFUI"
            ),
        },
    ];

    const generateTabContent = () => {
        const assignment = {
            ...tableContent,
            ASGN_REF_NO: tableContent?.ASGN_REF_NO,
            SRVY_NAME_ENG: tableContent?.SRVY_NAME_ENG,
            SRVY_UID: tableContent?.SRVY_UID,
            SRVY_CD: tableContent?.SRVY_CD,
            GUID: tableContent.GUID,
            ASGN_UID: tableContent.ASGN_UID,
            SC_CD: tableContent.SRVY_CYCLE_CODE,
            SC_UID: tableContent.SRVY_CYCLE_UID,
            EFC_GUID: tableContent.EFieldCardObject ? tableContent.EFieldCardObject[0]?.GUID : "",
            EFC_UID: tableContent.EFieldCardObject ? tableContent.EFieldCardObject[0]?.EFC_UID : "",
            TMPL_UID: tableContent.TMPL_UID,
            LAT_Q_DATA_VER_NO: tableContent.LAT_Q_DATA_VER_NO,
            ASGN_STS: tableContent.ASGN_STS,
            STP_UID: tableContent.STP_UID,
        };

        switch (assignmentDetailCurrentTab) {
            case "Interview":
                return (
                    <InterviewLog
                        content={orderBy(
                            tableContent?.InterviewLogListObject?.map(
                                (item) => {
                                    return {
                                        ...item,
                                        DT: moment(item.STRT_DT),
                                        STRT_TM: moment().hour(moment(item.STRT_DT).hour()).minute(moment(item.STRT_DT).minute()),
                                    };
                                }
                            ), ["DT"], ["desc"]
                        )}
                        assignment={assignment}
                        assignmentList={assignmentList}
                        formIOSchema={tableContent?.FormLanguageObject?.questionnaire || tableContent?.FormLanguageObject}
                        contactList={contactList}
                        SubmissionVersionObject={tableContent?.SubmissionVersionObject ?? []}
                        submissionVersion={submissionVersion}
                        setSubmissionVersion={setSubmissionVersion}
                        errList={assignment?.FormLanguageObject?.Error_List}
                        followUpList={assignment?.FormLanguageObject?.FollowUp_List}
                        isQuestionnaireDataReady={isQuestionnaireDataReady}
                        setIsQuestionnaireDataReady={setIsQuestionnaireDataReady}
                        pageSrc={pageSrc}
                    />
                );
            case "More Info.":
                return (
                    <AssignmentInfo
                        content={{ ...tableContent, ...(tableContent.AssignmentDetailObject?.[0] ?? {}), }}
                        assignment={assignment}
                    />
                );
            case "Appointment Booking":
                return (
                    <AppointmentInfo
                        content={appointmentList}
                        assignment={assignment}
                        contactList={contactList}
                    />
                );
            case "Contacts":
                return (
                    <ContactInfo
                        content={orderBy(contactList, ["UPD_DT"], ["desc"])}
                        assignment={assignment}
                        assignmentList={assignmentList}
                    />
                );
            case "Enquiries":
                return (
                    <EnquiryInfo
                        content={orderBy(enquiryLogList, ["STRT_DT"], ["desc"])}
                        assignment={assignment}
                        contactList={contactList}
                    />
                );
            case "Quality Check":
                return (
                    <QcInfo
                        assignment={assignment}
                        contactList={contactList}
                    // qcDetail={qcDetail}
                    // setQcDetail={setQcDetail}
                    />
                );
            default:
                return "";
        }
    };

    const onChangeTableContent = (key, value, type) => {
        let tempValue = {
            [key]: value,
        };
        if (key == "RFSL_IND" && (value == "N" || value == ""))
            tempValue = {
                ...tempValue,
                RFSL_LVL: "",
            };

        setTableContent((prevInput) => ({
            ...prevInput,
            ...tempValue,
        }));
    };

    const onEditRemarks = () => {
        setBackupRemarks(tableContent.BKM_RMKS);
        setIsEdit(true);
    };

    const onCancelRemarks = () => {
        setTableContent((prevInput) => ({
            ...prevInput,
            BKM_RMKS: backupRemarks,
        }));
        setIsEdit(false);
    };

    const onEditStatus = () => {
        setEnumStatus(tableContent.ENUM_RSLT_CD);
        setIsEditStatus(true);
    };

    const onCancelStatus = () => {
        setTableContent((prevInput) => ({
            ...prevInput,
            ENUM_RSLT_CD: enumStatus,
        }));
        setIsEditStatus(false);
    };

    // const onSaveRemarks = async () => {
    //     updateData('DCP', 'assignment', tableContent.GUID, 'BKM_RMKS', tableContent.BKM_RMKS)
    //     updateData('DCP', 'assignment', tableContent.GUID, 'BKM', tableContent.BKM_RMKS && tableContent.BKM_RMKS != '' ? 'Y' : 'N')
    //     const user = JSON.parse(sessionStorage.getItem('user'))

    //     let apiReqBody = {
    //         cm_usr_asgn_bkm_setList: [
    //             {
    //                 RecordState: backupRemarks != '' && (!tableContent.BKM_RMKS || tableContent.BKM_RMKS == '') ? 'D' : backupRemarks == '' ? 'I' : 'U',
    //                 STF_UID: user.id,
    //                 SYS_CD: "DCP",
    //                 ASGN_UID: tableContent.ASGN_UID,
    //                 ASGN_GUID: tableContent.GUID,
    //                 RMKS: tableContent.BKM_RMKS,
    //                 STS: backupRemarks != '' && (!tableContent.BKM_RMKS || tableContent.BKM_RMKS == '') ? 'D' : 'A'
    //             }
    //         ],
    //     }
    //     await checkNet(dispatch(updateAssignment(apiReqBody)));
    //     dispatch(triggerFetch());
    //     setIsEdit(false)
    // }

    const onClickViewActivity = () => {
        setIsViewActivity(true);
    };

    const updateForm = (key, value, type) => {
        let tempValue = {};
        if (type == "date") {
            const dateValue = {
                'year': value.split("-")[0],
                'month': parseInt(value.split("-")[1]) - 1,
                'date': value.split("-")[2],
            };
            tempValue = {
                [key]: moment(formContent[key]).set(dateValue).toISOString(true),
            };
        } else {
            tempValue = { [key]: value === "" ? null : value };
        }
        setFormContent((prev) => ({
            ...prev,
            ...tempValue,
        }));
    };

    const onDownloadAssignment = async () => {
        setIsLoading(true);
        try {
            const action = await dispatch(
                downloadAssignment({
                    pStaffPositionUid: user?.stf_position,
                    pGuidList: [
                        {
                            RecordState: "I",
                            ASGN_GUID: tableContent.GUID,
                        },
                    ],
                })
            ).unwrap();

            let efcRes = await dispatch(getEFieldCardByAssignmentGuid({
                pAssignmentGuid: id,
            })).unwrap();
            let efcData = efcRes?.data?.eFieldCard;
            if (efcData) {
                const newContent = efcData.map((content) => {
                    const latestLog = content.EFieldCardVisitRecordObject.reduce((prev, curr) => {
                        if (!curr.END_DT) return prev;
                        if (!prev?.END_DT) return curr;
                        return moment(curr.END_DT).isAfter(
                            moment(prev.END_DT)
                        ) ? curr : prev;
                    }, null);

                    return {
                        ...content,
                        LST_PREF_TIME: latestLog?.PREF_TIME,
                        LST_RESPT_LNG: latestLog?.RESPT_LNG,
                        LST_CONT_METH_PREF: latestLog?.CONT_METH_PREF,
                        LST_STRT_DT: latestLog?.STRT_DT,
                    };
                });

                await pAddData("DCP", "eFieldCard", newContent, "GUID", false, dbc, user);
            }

            await dispatch(
                getSegmentMapCoordinateByStaffUid({ pStaffUid: user.id })
            )
                .unwrap()
                .then((action) => {
                    if (action?.status == "200" && action.data.ErrCode != 1) {
                        pAddData("DCP", "segmentCoor", action.data.coordinateList, "SEG_UID", false, dbc, user)
                    }
                });

            if (action?.status == "200" && action.data.ErrCode != 1) {
                setAlertContent({
                    isOpen: true,
                    onClose: () => {
                        setAlertContent({ isOpen: false });
                    },
                    title: "Notice",
                    msg: "Assignment downloaded successfully",
                });
            }

            efcRes = null;
            efcData = null;
        } catch (action) {
            // setIsLoading(false)
            setAlertContent({
                isOpen: true,
                onClose: () => {
                    setAlertContent({ isOpen: false });
                },
                title: "Warning",
                msg: action.message,
            });
        } finally {
            setIsLoading(false);
        }
        dispatch(triggerFetch());
    };

    const handleUpdate = async (action) => {
        await onSaveRemarks();

        if (!tableContent.SEL_APRV_POSN_UID && action != 'postSurvey') {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: "Error",
                msg: "Please select approver",
            });
            return;
        }

        if (action == 'submit' && needEOE && !tableContent.ENUM_RSLT_CD) {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: "Error",
                msg: "Please submit with Enum. Status",
            });
            return;
        }

        if (action == 'submit' && localState.interviewStage == 1) {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: "Error",
                msg: "Please end interview",
            });
            return;
        }

        let submitVersion = tableContent?.SubmissionVersionObject?.find(
            (item) => item.Q_DATA_VER_NO == tableContent.Q_DATA_VER_NO
        );

        if (needEOE) {
            submitVersion = null;
        } else if (tableContent?.followupSubmission?.length) {
            submitVersion = tableContent?.SubmissionVersionObject?.find(
                (item) =>
                    item.Q_DATA_VER_NO ==
                    tableContent?.followupSubmission.find(
                        (item) => item.Form_ID == tableContent.TEMP_DOC_REF_NO
                    )?.Version
            );
        } else if (Object.keys(submissionVersion)?.length) {
            submitVersion = submissionVersion;
        }

        if (!needEOE && contactList?.length == 0) {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: "Warning",
                msg: "Please submit with at least one contact detail",
            });
            return;
        }

        if (
            !needEOE &&
            submitVersion &&
            (submitVersion.Q_DATA_STS == "PC" || submitVersion.RVW_STS == "P" ||
                submitVersion.RVW_STS == "D" || submitVersion.DF_STS == "D" ||
                submitVersion.DF_STS == "Q") && action == "submit"
        ) {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: "Error",
                msg: "Form incomplete",
            });
            return;
        }

        if (tableContent.HLD_STS == 'H' && (action == 'submit' || action == 'approve' || action == 'update' || action == 'discard')) {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: "Warning",
                msg: "Assignment is on hold",
            });
            return;
        }

        if (needEOE && !tableContent.EOE_RSN_CD) {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: "Warning",
                msg: "Please provide reason for EOE",
            });
            return;
        }

        if ((tableContent.APRV_RMKS == '' || tableContent.APRV_RMKS == null) && action == 'reject') {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: "Warning",
                msg: "Approver remark required",
            });
            return;
        }

        if (!needEOE && !tableContent.Q_DATA_VER_NO) {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: "Warning",
                msg: "Please select a submission version to submit the assignment",
            });
            return;
        }

        if((tableContent?.ASGN_STG_IND === "F" ||  tableContent?.ASGN_STG_IND === "PF") && tableContent?.Q_DATA_STS === "CMP"){
            submitVersion = tableContent?.SubmissionVersionObject?.find(
            (item) => item.Q_DATA_VER_NO == tableContent.FU_Q_DATA_VER_NO
        );
        } 
        const requestBody =
            action == "submit" || action == "update" || action == "discard"
                ? {
                    REQ_BY_STF_UID: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.STF_UID ?? tableContent.RESP_STF_UID,
                    REQ_BY_STF_NO: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.STF_NO ?? tableContent.RESP_STF_UID,
                    REQ_BY_STF_NAME_ENG: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.NAME_ENG ?? tableContent.Responsible_Officer_English_Name,
                    REQ_BY_STF_NAME_CHI: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.NAME_CHI ?? tableContent.Responsible_Officer_Chinese_Name,
                    REQ_BY_POSN_UID: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.POSN_UID ?? tableContent.RESP_POSN_UID,
                    REQ_BY_POSN_CD: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.POSN_CD ?? tableContent.REQ_BY_POSN_CD,
                    REQ_BY_POSN_NAME_ENG: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.POSN_NAME_ENG ?? tableContent.REQ_BY_POSN_NAME_ENG,
                    REQ_BY_POSN_NAME_CHI: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.POSN_NAME_ENG ?? tableContent.REQ_BY_POSN_NAME_ENG,
                    REQ_DT: moment().format("YYYY-MM-DD HH:mm:ss"),
                    REQ_RMKS: tableContent.REQ_RMKS,
                }
                : {
                    REQ_BY_STF_UID: tableContent.REQ_BY_STF_UID,
                    REQ_BY_STF_NO: tableContent.REQ_BY_STF_NO,
                    REQ_BY_STF_NAME_ENG: tableContent.REQ_BY_STF_NAME_ENG,
                    REQ_BY_STF_NAME_CHI: tableContent.REQ_BY_STF_NAME_CHI,
                    REQ_BY_POSN_UID: tableContent.REQ_BY_POSN_UID,
                    REQ_BY_POSN_CD: tableContent.REQ_BY_POSN_CD,
                    REQ_BY_POSN_NAME_ENG: tableContent.REQ_BY_POSN_NAME_ENG,
                    REQ_BY_POSN_NAME_CHI: tableContent.REQ_BY_POSN_NAME_CHI,
                    REQ_DT: tableContent.REQ_DT,
                    REQ_RMKS: tableContent.REQ_RMKS,
                };

        const approverBody =
            action == "reject" || action == "approve" || action == "discard"
                ? {
                    APRV_STF_UID: user.id,
                    APRV_STF_NO: user.stf_no,
                    APRV_STF_NAME_ENG: user.name,
                    APRV_STF_NAME_CHI: user.name_chi,
                    APRV_POSN_UID: user.position,
                    APRV_POSN_CD: user.role,
                    APRV_POSN_NAME_ENG: user.role_name,
                    APRV_POSN_NAME_CHI: user.role_name,
                    APRV_STS: action == "reject" ? "R" : action == "approve" ? "A" : "D",
                    APRV_DT: moment().format("YYYY-MM-DD HH:mm:ss"),
                    APRV_RMKS: tableContent.APRV_RMKS,
                }
                : {
                    APRV_STF_UID: tableContent.APRV_STF_UID,
                    APRV_STF_NO: tableContent.APRV_STF_NO,
                    APRV_STF_NAME_ENG: tableContent.APRV_STF_NAME_ENG,
                    APRV_STF_NAME_CHI: tableContent.APRV_STF_NAME_CHI,
                    APRV_POSN_UID: tableContent.APRV_POSN_UID,
                    APRV_POSN_CD: tableContent.APRV_POSN_CD,
                    APRV_POSN_NAME_ENG: tableContent.APRV_POSN_NAME_ENG,
                    APRV_POSN_NAME_CHI: tableContent.APRV_POSN_NAME_ENG,
                    APRV_STS: "P",
                    APRV_DT: tableContent.APRV_DT,
                    APRV_RMKS: tableContent.APRV_RMKS,
                };

        // await dispatch(updateAssignment({
        //     cm_asgn_main_setList: [{
        //         RecordState: 'U',
        //         ASGN_UID: tableContent.ASGN_UID,
        //         GUID: tableContent.GUID,
        //         SEL_APRV_POSN_UID: tableContent.SEL_APRV_POSN_UID,
        //     }],
        //     cm_asgn_aprv_req_setList: [{
        //         ...requestBody,
        //         ...approverBody,
        //         RecordState: action == 'reject' || action == 'approve' ? 'U' : 'I',
        //         APRV_REQ_UID: tableContent.APRV_REQ_UID,
        //         ASGN_UID: tableContent.ASGN_UID,
        //         ASGN_GUID: tableContent.GUID,
        //         SEL_APRV_STF_UID: tableContent.SEL_APRV_STF_UID,
        //         SEL_APRV_STF_NO: tableContent.SEL_APRV_STF_NO,
        //         SEL_APRV_STF_NAME_ENG: tableContent.SEL_APRV_STF_NAME_ENG,
        //         SEL_APRV_STF_NAME_CHI: tableContent.SEL_APRV_STF_NAME_CHI,
        //         SEL_APRV_POSN_UID: tableContent.SEL_APRV_POSN_UID,
        //         SEL_APRV_POSN_CD: tableContent.SEL_APRV_POSN_CD,
        //         SEL_APRV_POSN_NAME_ENG: tableContent.SEL_APRV_POSN_NAME_ENG,
        //         SEL_APRV_POSN_NAME_CHI: tableContent.SEL_APRV_POSN_NAME_CHI,
        //     }],
        // }))

        let workflow = {
            FCN_CD: null,
            Q_DATA_STS: null,
            DEL_IND: null,
            Q_APRV_IND: null,
            VLD_RSLT: null,
            FU_IND: null,
            QC_IND: null,
            RVW_RSLT: null,
            Q_DATA_TYP: null,
            EOE_IND: null,
            Q_DATA_VER_NO: submitVersion?.Q_DATA_VER_NO ?? null,
        };

        const ASGN_STG_IND = tableContent.ASGN_STG_IND;
        //const ASGN_STS = (isAbleToSelfSubmitApprove && tableContent.ASGN_STS == 'PFU') ? "FUI" : tableContent.ASGN_STS
        const ASGN_STS = tableContent.ASGN_STS;

        switch (action) {
            case 'update':
            case 'submit': {
                const FCN_CD = getSubmitFunctionCode(tableContent)
                if (isAbleToSelfSubmitApprove) {
                    //fixed Q_APRV_IND, VLD_RSLT, FU_IND for self approve case
                    workflow.FCN_CD = FCN_CD
                    workflow.Q_APRV_IND = 'A'
                    workflow.VLD_RSLT = 'N'
                    //directly put in assignment obj
                    workflow.FU_IND = undefined //'Y'
                    workflow.QC_IND = undefined //'Y'
                    workflow.EOE_IND = FCN_CD == 'DCP_WF_APPL_ENUM' || FCN_CD == 'DCP_WF_APPL_EOFA' || FCN_CD == 'DCP_WF_APPL_EOPFU' ? 'P' : null
                    workflow.Q_DATA_STS = 'CMP'
                    workflow.Q_DATA_TYP = submitVersion?.Q_DATA_TYP ?? null
                }
                else {
                    workflow.FCN_CD = FCN_CD;
                    workflow.VLD_RSLT = needEOE || (FCN_CD == 'DCP_WF_SUBM_CD_ED' && tableContent.ASGN_STG_IND == 'PC') ? null : 'N';
                    workflow.Q_APRV_IND = (FCN_CD == 'DCP_WF_SUBM_Q' && ASGN_STS != 'QSR') ? 'P' : null;
                    workflow.EOE_IND = FCN_CD == 'DCP_WF_APPL_ENUM' || FCN_CD == 'DCP_WF_APPL_EOFA' || FCN_CD == 'DCP_WF_APPL_EOPFU' ? 'P' : null
                    workflow.Q_DATA_STS = submitVersion?.Q_DATA_STS ?? null;
                    workflow.Q_DATA_TYP = submitVersion?.Q_DATA_TYP ?? null;
                }
                break;
            }
            case "reject": {
                if (needEOE) {
                    //for handle eoe case
                    switch (ASGN_STG_IND) {
                        case "D":
                            workflow.FCN_CD = "DCP_WF_REJ_APP_ENUM";
                            break;
                        case "F":
                            workflow.FCN_CD = "DCP_WF_REJ_APP_EOFA";
                            break;
                        case "PF":
                            workflow.FCN_CD = "DCP_WF_REJ_APP_EOPFU";
                            break;
                        default:
                            break;
                    }

                    workflow.EOE_IND = "R";
                } else {
                    if (tableContent.ASGN_STS == "QSP") {
                        workflow.FCN_CD = "DCP_WF_REJ_Q";
                    } else if (
                        tableContent.ASGN_STS == "FQSP" || tableContent.ASGN_STS == "PFQSP"
                    ) {
                        workflow.FCN_CD = "DCP_WF_REJ_FU_QC";
                    }
                    workflow.Q_APRV_IND = "R";
                }
                break;
            }
            case "approve": {
                if (needEOE) {
                    //for handle eoe case
                    switch (ASGN_STG_IND) {
                        case "D":
                            workflow.FCN_CD = "DCP_WF_APR_APP_ENUM";
                            break;
                        case "F":
                            workflow.FCN_CD = "DCP_WF_APR_APP_EOFA";
                            break;
                        case "PF":
                            workflow.FCN_CD = "DCP_WF_APR_APP_EOPFU";
                            break;
                        default:
                            break;
                    }

                    workflow.EOE_IND = "A";
                } else {
                    if (tableContent.ASGN_STS == "QSP") {
                        workflow.FCN_CD = "DCP_WF_APR_Q";
                    } else if (
                        tableContent.ASGN_STS == "FQSP" || tableContent.ASGN_STS == "PFQSP"
                    ) {
                        workflow.FCN_CD = "DCP_WF_APR_FU_QC";
                    }
                    workflow.Q_APRV_IND = "A";
                }

                break;
            }
            case "discard": {
                workflow.FCN_CD = "DCP_WF_DIS_FU_QC";
                workflow.Q_APRV_IND = "D";
                break;
            }
            case "postSurvey": {
                workflow.FCN_CD = "DCP_WF_ASGN_POST_SRVY_ACTY";
                break;
            }
            default:
                break;
        }

        // workflow = {
        //     ...workflow,
        //     Q_DATA_STS: submissionVersion?.Q_DATA_STS ?? workflow.Q_DATA_STS,
        //     Q_DATA_TYP: submissionVersion?.Q_DATA_TYP ?? workflow.Q_DATA_TYP,
        //     Q_DATA_VER_NO: tableContent?.followupSubmission?.Version ?? submissionVersion?.Q_DATA_VER_NO ?? workflow.Q_DATA_VER_NO,
        // }
        const approverRequestBody =
            action != "postSurvey"
                ? {
                    SP_CM_SET_ASGN_APRV_REQ: {
                        ...requestBody,
                        ...approverBody,
                        RecordState: action != "submit" ? "U" : "I",
                        APRV_REQ_UID: tableContent.APRV_REQ_UID,
                        ASGN_UID: tableContent.ASGN_UID,
                        ASGN_GUID: tableContent.GUID,
                        SEL_APRV_STF_UID: tableContent.SEL_APRV_STF_UID,
                        SEL_APRV_STF_NO: tableContent.SEL_APRV_STF_NO,
                        SEL_APRV_STF_NAME_ENG: tableContent.SEL_APRV_STF_NAME_ENG,
                        SEL_APRV_STF_NAME_CHI: tableContent.SEL_APRV_STF_NAME_CHI,
                        SEL_APRV_POSN_UID: tableContent.SEL_APRV_POSN_UID,
                        SEL_APRV_POSN_CD: tableContent.SEL_APRV_POSN_CD,
                        SEL_APRV_POSN_NAME_ENG: tableContent.SEL_APRV_POSN_NAME_ENG,
                        SEL_APRV_POSN_NAME_CHI: tableContent.SEL_APRV_POSN_NAME_CHI,
                    },
                }
                : {};

        let assignmentObj = {
            ...approverRequestBody,
            ASGN_UID: tableContent.ASGN_UID,
            ASGN_GUID: tableContent.GUID,
            SRVY_UID: tableContent.SRVY_UID,
            SRVY_CD: tableContent.SRVY_CD,
            STP_UID: tableContent.STP_UID,
            ASGN_STS: tableContent.ASGN_STS,
            Q_DATA_STS: needEOE ? null : workflow.Q_DATA_STS,
            Q_DATA_TYP: needEOE ? null : workflow.Q_DATA_TYP,
            Q_DATA_VER_NO: workflow.Q_DATA_VER_NO,
            ENUM_MDE: action == "reject" || action == "approve" || needEOE ? null : tableContent.ENUM_MDE,
            VLD_RSLT: workflow.VLD_RSLT,
            FCN_CD: workflow.FCN_CD,
            Q_APRV_IND: workflow.Q_APRV_IND,
            EOE_IND: workflow.EOE_IND,
        };

        if (isAbleToSelfSubmitApprove) {
            assignmentObj.FU_IND = 'Y'
            assignmentObj.QC_IND = 'Y'
        }

        await getData('DCP', 'assignment', tableContent.GUID).then(data => {
            if (data) {

                if (isAbleToSelfSubmitApprove) {
                    assignmentObj.FU_IND = 'Y'
                    assignmentObj.QC_IND = 'Y'
                }

                let asgnSts = assignmentObj.ASGN_STS;
                if (needEOE && data.ASGN_STG_IND === "F" && data.ASGN_STS === "PFU") {
                    asgnSts = "EOFP";
                } else if (needEOE && data.ASGN_STG_IND === "PF" && data.ASGN_STS === "PPFU") {
                    asgnSts = "EOPFP";
                } else if (data.ASGN_STG_IND === "D" && data.ASGN_STS === "EIP") {
                    asgnSts = "QSP";
                }
                updateData("DCP", "assignment", data.GUID, null,
                    {
                        ...data,
                        ASGN_STS: asgnSts,
                    });
            }
        });

        await dispatch(
            workflowHandling({
                assignments: [assignmentObj],
                DEL_IND: workflow.DEL_IND,
                FU_IND: workflow.FU_IND,
                QC_IND: workflow.QC_IND,
                RVW_RSLT: workflow.RVW_RSLT,
            })
        );

        setQcDetail(null);
        await dispatch(triggerFetch());
    };

    const onSaveDetail = async () => {
        // updateData('DCP', 'assignment', tableContent.GUID, 'BKM_RMKS', tableContent.BKM_RMKS)
        // updateData('DCP', 'assignment', tableContent.GUID, 'BKM', tableContent.BKM_RMKS && tableContent.BKM_RMKS != '' ? 'Y' : 'N')
        const newAprvReqGUID = uuid();
        await getData("DCP", "assignment", tableContent.GUID).then((data) => {
            if (data) {
                updateData("DCP", "assignment", data.GUID, null, {
                    ...data,
                    BKM_RMKS: tableContent.BKM_RMKS,
                    BKM: tableContent.BKM_RMKS && tableContent.BKM_RMKS != "" ? "Y" : "N",
                });
            }
        });

        let apiReqBody = {
            cm_usr_asgn_bkm_setList: [
                {
                    RecordState:
                        backupRemarks != "" && (!tableContent.BKM_RMKS || tableContent.BKM_RMKS == "") ? "D" : backupRemarks == "" ? "I" : "U",
                    STF_UID: user.id,
                    SYS_CD: "DCP",
                    ASGN_UID: tableContent.ASGN_UID,
                    ASGN_GUID: tableContent.GUID,
                    RMKS: tableContent.BKM_RMKS,
                    STS: backupRemarks != "" && (!tableContent.BKM_RMKS || tableContent.BKM_RMKS == "") ? "D" : "A",
                },
            ],
        };
        await checkNet(dispatch(updateAssignment(apiReqBody)));
        dispatch(triggerFetch());
        setIsEdit(false);
    };

    const onSaveStatus = async () => {
        const newAprvReqGUID = uuid();
        await getData("DCP", "assignment", tableContent.GUID).then((data) => {
            if (data) {
                updateData("DCP", "assignment", data.GUID, null, {
                    ...data,
                    ENUM_RSLT_CD: tableContent.ENUM_RSLT_CD,
                    ENUM_RSLT_CD_DESCR: enumResultList.find(
                        (item) => item.value == tableContent.ENUM_RSLT_CD
                    )?.label,
                });
            }
        });

        if (tableContent.ENUM_RSLT_CD == null || tableContent.ENUM_RSLT_CD == "") {
            onChangeApprover(null)
            setAlertContent({
                isOpen: true,
                title: "Warning",
                msg: "Please select Enum. Status before save",
                onClose: () => {
                    setAlertContent({
                        isOpen: false,
                        title: "",
                        msg: "",
                        onClose: () => { },
                    });
                },
            });
            return;
        }

        let apiReqBody = {
            cm_asgn_main_setList: [
                {
                    RecordState: "U",
                    STF_UID: user.id,
                    ASGN_UID: tableContent.ASGN_UID,
                    GUID: tableContent.GUID,
                    ENUM_RSLT_CD: tableContent.ENUM_RSLT_CD,
                },
            ],
        };
        await checkNet(dispatch(updateAssignment(apiReqBody)));
        dispatch(triggerFetch());
        setIsEditStatus(false);
    };

    const onSaveRemarks = async () => {
        const newAprvReqGUID = uuid();

        await updateData("DCP", "assignment", id, null, tableContent);

        const submitData = {
            cm_asgn_aprv_req_setList: [
                {
                    RecordState: tableContent.APRV_REQ_GUID ? "U" : "I",
                    ASGN_UID: tableContent.ASGN_UID,
                    ASGN_GUID: tableContent.GUID,
                    APRV_RMKS: tableContent.APRV_RMKS,
                    APRV_REQ_UID: tableContent.APRV_REQ_UID,
                    GUID: tableContent.APRV_REQ_GUID ?? newAprvReqGUID,
                    REQ_RMKS: tableContent.REQ_RMKS,
                    REQ_BY_STF_UID: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.STF_UID ?? tableContent.RESP_STF_UID,
                    REQ_BY_POSN_UID: tableContent.AssignmentDetailObject[0]?.OfficerList[0]?.POSN_UID ?? tableContent.RESP_POSN_UID,
                },
            ],
            cm_asgn_main_setList: [
                {
                    RecordState: "U",
                    ASGN_UID: tableContent.ASGN_UID,
                    GUID: tableContent.GUID,
                    EOE_RSN_CD: tableContent.EOE_RSN_CD ?? "",
                    MIST_TYP: tableContent.MIST_TYP,
                    MIST_RMKS: tableContent.MIST_TYP_RMKS,
                },
            ],
        };
        await dispatch(updateAssignment(submitData));
        dispatch(triggerFetch());
    };

    // const onSaveEOEReason = async () => {
    //     await updateData('DCP', 'assignment', id, 'EOE_RSN_CD', tableContent.EOE_RSN_CD ?? '')
    //     const submitData = {
    //         cm_asgn_main_setList: [{
    //             RecordState: 'U',
    //             ASGN_UID: tableContent.ASGN_UID,
    //             GUID: tableContent.GUID,
    //             EOE_RSN_CD: tableContent.EOE_RSN_CD ?? '',
    //         }]
    //     }
    //     await dispatch(updateAssignment(submitData))
    //     dispatch(triggerFetch());
    // }

    // const onOpenQCTForm = () => {
    //     setQctFormContent({
    //         isOpen: true,
    //         field3: 1,
    //         field4: 1,
    //         field5: "T",
    //         field6: 1,
    //     });
    // };

    // const onCloseQctForm = () => {
    //     setQctFormContent({
    //         isOpen: false,
    //     });
    // };

    // const updateQctFormContent = (key, value) => {
    //     setQctFormContent((previousInputs) => ({
    //         ...previousInputs,
    //         [key]: value == "" ? null : value,
    //     }));
    // };

    const openApproveForm = async () => {
        const formIOSchema = tableContent?.FormLanguageObject;
        let engList = {};
        let zhList = {};
        engList = formIOSchema.Language ? JSON.parse(formIOSchema.Language) : {};
        const subFormLanguage = getSubForm(formIOSchema).map((form) => form?.Language ? JSON.parse(form.Language) : {});
        subFormLanguage.forEach((lang) => {
            engList = {
                ...engList,
                ...lang,
            };
        });
        Object.keys(engList).forEach((k) => {
            zhList[k] = k;
        });
        await dispatch(updateQuestionnaireState({
            key: "latestVersion",
            value: tableContent.LAT_Q_DATA_VER_NO,
        }));
        await dispatch(
            updateQuestionnaireState({
                key: "info",
                value: {
                    // schema: [formIOSchema],
                    option: {
                        language: "zh",
                        i18n: {
                            zh: {
                                ...zhList,
                            },
                            en: {
                                ...engList,
                            },
                        },
                        buttonSettings: { showSubmit: false, showCancel: false, },
                        alwaysDirty: true,
                    },
                    errList: tableContent?.FormLanguageObject?.Error_List,
                    followUpList: tableContent?.FormLanguageObject?.FollowUp_List,
                    submission: JSON.parse(tableContent?.submission?.find((item) => item.Form_ID == tableContent.TEMP_DOC_REF_NO || item.Assignment_Uid == tableContent.ASGN_UID)?.Submission_FormIo),
                    date: {
                        YYYY: tableContent.YYYY,
                        MM: tableContent.MM,
                    },
                    formGUID: tableContent.TEMP_DOC_REF_NO + "_" + tableContent.TMPL_VLD_VER_NO,
                },
            })
        );
        await dispatch(
            updateQuestionnaireState({
                key: "drawerList",
                value: {
                    errCodingList: tableContent?.submission.flatMap((sub) => sub.Submission_Error ? JSON.parse(sub.Submission_Error) : []),
                    FUList: tableContent?.submission.flatMap((sub) => sub.Submission_FollowUp ? JSON.parse(sub.Submission_FollowUp) : []),
                    bypassList: tableContent?.submission.flatMap((sub) => sub.Submission_ByPass ? JSON.parse(sub.Submission_ByPass) : []),
                    clearList: tableContent?.submission.flatMap((sub) => sub.Submission_Cleared ? JSON.parse(sub.Submission_Cleared) : []),
                },
            })
        );
        await dispatch(updateState({
            key: 'localState',
            value: {
                ...localState,
                INTV_MDE: "D",
            }
        }))
        navigate("questionnaire/approval");
    };

    const getSubmitFunctionCode = (tableContent) => {
        let code = null;

        switch (tableContent.ASGN_STG_IND) {
            case "D": {
                if (needEOE) {
                    code = "DCP_WF_APPL_ENUM";
                } else {
                    code = "DCP_WF_SUBM_Q";
                }
                break;
            }
            case "C":
            case "PC": {
                code = "DCP_WF_SUBM_CD_ED";
                break;
            }
            case "F": {
                if (needEOE) {
                    code = "DCP_WF_APPL_EOFA";
                } else {
                    code = "DCP_WF_SUBM_FU_QC";
                }
                break;
            }
            case "PF": {
                if (needEOE) {
                    code = "DCP_WF_APPL_EOPFU";
                } else {
                    code = "DCP_WF_SUBM_FU_QC";
                }
                break;
            }
            default:
                break;
        }

        return code;
    };

    const onChangeApprover = (value) => {
        const delegateList = delegatedAssignmentApproverList?.find(item => item.STF_POSN_UID == user.stf_position)?.ApproverList.map(item => ({
            ...item,
            DELG_GUID: `${item.DELG_STF_UID_FRM}_${item.DELG_POSN_UID_FRM}`
        })) ?? []
        //[20250217 update] no longer by ASGN_UID to link delegate
        const approver = approverList.find(item => item?.GUID == value)
        const target = delegateList.find(item => item?.DELG_GUID == value /*&& item.ASGN_UID == tableContent.ASGN_UID*/)
        const reverseTarget = delegateList.find(item => item?.STF_UID === approver?.STF_UID);
        const reverseApprover = approverList.find(item => item?.STF_UID === reverseTarget?.DELG_STF_UID_FRM);

        // console.log("[debug] approver", approver)
        // console.log("[debug] target", target)
        // console.log("[debug] reverseTarget", reverseTarget)
        // console.log("[debug] reverseApprover", reverseApprover)
        setTableContent(c => ({
            ...c,
            SEL_APRV_STF_UID: approver?.STF_UID ?? null,
            SEL_APRV_STF_NO: approver?.STF_NO ?? null,
            SEL_APRV_STF_NAME_ENG: approver?.STF_NAME ?? null,
            SEL_APRV_STF_NAME_CHI: approver?.STF_NAME_CHI ?? null,
            SEL_APRV_POSN_UID: approver?.POSN_UID ?? null,
            SEL_APRV_POSN_CD: approver?.POSN_CD ?? null,
            SEL_APRV_POSN_NAME_ENG: approver?.POSN_NAME ?? null,
            SEL_APRV_POSN_NAME_CHI: approver?.POSN_NAME_CHI ?? null,
        }));

        if (target) {
            setDelegateApprover(target);
            setReverseApprover(null);
            setReverseTarget(null);
        } else if (reverseApprover) {
            setReverseApprover(reverseApprover);
            setReverseTarget(reverseTarget);
            setDelegateApprover(null);
        } else {
            setDelegateApprover(null);
            setReverseApprover(null);
            setReverseTarget(null);
        }
    };

    const handleApprovewithQC = (assignment) => {
        const QCLogObject = assignment?.QualityControlLogObject ?? tableContent?.QualityControlLogObject;
        const targetQC = QCLogObject?.find((item) => item.QC_TYP_UID == 3 && (item.QC_STS == "N" || item.QC_STS == "I")) ?? assignment ?? tableContent;

        setQcDetail({
            FLD_POOL: targetQC.POOL_OU_NAME_ENG,
            FLD_TEAM: targetQC.TEAM_NAME_ENG,
            FLD_POSN_NAME: targetQC.REQ_BY_POSN_NAME_ENG,
            STF_NO: targetQC.REQ_BY_STF_NO,
            CHK_FLD_TEAM: targetQC.TEAM_NAME_ENG,
            CHK_FLD_POOL: targetQC.POOL_OU_NAME_ENG,
            //CHK_POSN_NAME: targetQC.SEL_APRV_POSN_NAME_ENG,
            QC_LOG_UID: targetQC.QC_LOG_UID,
            QC_RSLT_UID: targetQC.QC_RSLT_UID,
            SRVY_CD: targetQC.SRVY_CD,
            SC_CD: targetQC.SC_CD ?? targetQC.SRVY_CYCLE_CODE,
            ASGN_REF_NO: targetQC.ASGN_REF_NO,
            ASGN_STS: targetQC.ASGN_STS_DESCR ?? targetQC.ASGN_STS,
            ENUM_RSLT_CD: targetQC.ENUM_RSLT_CD,
            QC_STS: targetQC.QC_STS ?? "N",
            FLD_STF_NAME: targetQC.FLD_STF_NAME ?? targetQC.Responsible_Officer_English_Name,
            ASGN_UID: targetQC.ASGN_UID,
            SC_UID: targetQC.SC_UID ?? targetQC.SRVY_CYCLE_UID,
            STF_POSN_UID_QC: targetQC.STF_POSN_UID_QC,
            CHK_STF_NAME: user.name,
            CHK_POSN_NAME: user.position_name,
            ALLOC_SUP_POSN_UID: user.stf_position,
            MJR_IND: targetQC.MJR_IND,
            MJR_CNT: targetQC.MJR_CNT,
            MINR_IND: targetQC.MINR_IND,
            MINR_CNT: targetQC.MINR_CNT,
            NO_MIST_IND: targetQC.NO_MSTK,
            RMKS: targetQC.RMKS,
            CK_DT: targetQC.CK_DT,
            QC_DT: targetQC.QC_DT,
            QS_SUBM_DT: targetQC.QS_SUBM_DT,
            assignmentApproval: needCursory ? null : () => handleUpdate("approve"),
        });
    };

    //const { setIsRequireReload } = useContext(ReloadContext);

    //console.log("tableContent test", tableContent?.InterviewLogListObject.filter(item => item.END_DT != null).length)
    return (
        <>
            <div id="assignmentDetails" className="pageMainWrapper">
                <div className="topControlBtns">
                    <div className="btnGroup">
                        <Button
                            variant="purple"
                            onClick={() => {
                                localStorage.setItem("backRoute", true);
                                isNeedExtraRedirect ? navigate(-2) : navigate(-1);
                            }}
                        >
                            Back
                        </Button>
                    </div>
                    <div className="btnGroup">
                        <Button variant="purple" onClick={() => { onDownloadAssignment(); }} >  Download  </Button>
                    </div>
                </div>
                <Container className="generalInformation" variant="whiteShadow">
                    <div className="titleWrapper">
                        <div className="fieldItem">
                            <label>Assignment Details</label>
                        </div>
                        <div className="fieldItem">
                            <label>Last Refresh:</label>
                            <div className="inputItem"> {tableContent.FETCH_DATE ? moment(tableContent.FETCH_DATE).format("YYYY-MM-DD HH:mm") : "N/A"} </div>
                        </div>
                    </div>
                    {/*Form Position*/}
                    <div className="information">
                        <DataForm
                            tableStructure={tableStructure_general}
                            content={tableContent}
                            updateFormAction={null}
                            submitAction={null}
                            mode={"view"}
                            colspan={2}
                            flexDir={"row"}
                        />
                        {/* <DataForm
                            tableStructure={refuse_structure}
                            content={tableContent}
                            updateFormAction={onChangeTableContent}
                            submitAction={null}
                            colspan={2}
                            flexDir={'row'}
                        /> */}
                    </div>
                    <div className="bottomCtrlBtnsWrapper center">
                        <Button
                            variant="blue"
                            onClick={() => { onClickViewActivity(); }}
                        >
                            View Assignment Activities
                        </Button>
                        {/* <Button
                            variant="blue"
                            onClick={() => { onSaveDetail() }}
                        >
                            Save
                        </Button> */}
                    </div>
                </Container>
                <div className="tabContainer">
                    {
                        ["More Info.", "Interview", "Appointment Booking", "Contacts", "Enquiries", "Quality Check",].filter((item) => {
                            let show = true;
                            if (!user.isSupervisor) {
                                show = show && item != "Quality Check";
                            }

                            if (!user.isDefaultOfficer && user.isTelOperator) {
                                show = show && item != "Contacts";
                            }

                            return show;
                        })?.map((item, index) => (
                            <Button
                                key={"btn" + index}
                                className={`tabButton ${assignmentDetailCurrentTab == item ? "active" : "notActive"}`}
                                onClick={() => {
                                    setAssignmentDetailCurrentTab(item);
                                    dispatch(updateState({
                                        key: "tabIndex", value: item,
                                    }));
                                }}
                            >
                                {item}
                            </Button>
                        ))}
                </div>
                {assignmentDetailCurrentTab ? (
                    <Container className="infoContainer" variant="outlinePurple" >
                        {generateTabContent()}
                    </Container>
                ) : ("")}
                <Container variant="outlinePurple" className="remarksBoxWrapper" >
                    <DataForm
                        tableStructure={EOEStructure}
                        content={tableContent}
                        updateFormAction={(key, value) => setTableContent((c) => ({
                            ...c,
                            [key]: value,
                        }))}
                    />
                </Container>
                <Container variant="outlinePurple" className="remarksBoxWrapper" >
                    <DataForm
                        tableStructure={mistakeStructure}
                        content={tableContent}
                        updateFormAction={(key, value) => {
                            setTableContent((c) => ({
                                ...c,
                                [key]: value,
                            }));
                        }}
                    />
                    {/* <div className='remarksBox'>
                        <label>Mistake remarks:</label>
                        <Textarea variant="whiteShadow"
                            value={tableContent.APRV_RMKS}
                            onChange={(e) => {
                                setTableContent(c => ({
                                    ...c,
                                    APRV_RMKS: e.target.value
                                }))
                            }}
                            isDisabled={}
                        />
                    </div> */}
                </Container>
                <Container variant="outlinePurple" className="remarksBoxWrapper" >
                    <div className="remarksBoxGroup">
                        <div className="remarksBox">
                            <label className="top">Field Staff Remarks:</label>
                            <Textarea
                                variant="whiteShadow"
                                value={tableContent.REQ_RMKS ?? ""}
                                onChange={(e) => {
                                    setTableContent((c) => ({
                                        ...c,
                                        REQ_RMKS: e.target.value,
                                    }));
                                }}
                                isDisabled={!(tableContent.ASGN_STS == "PE" || tableContent.ASGN_STS == "EIP" || tableContent.ASGN_STS == "FUI" || tableContent.ASGN_STS == "PFUI" || tableContent.ASGN_STS == "QSR" || tableContent.ASGN_STS == "FQSR" || tableContent.ASGN_STS == "PFQSR")}
                            />
                        </div>
                        <div className="remarksBox">
                            <label className="top">Approver Remarks:</label>
                            <Textarea
                                variant="whiteShadow"
                                value={tableContent.APRV_RMKS ?? ""}
                                onChange={(e) => {
                                    setTableContent((c) => ({
                                        ...c,
                                        APRV_RMKS: e.target.value,
                                    }));
                                }}
                                isDisabled={!(user.position == tableContent.SEL_APRV_POSN_UID && user.id == tableContent.SEL_APRV_STF_UID)}
                            />
                        </div>
                    </div>
                </Container>
                <Box className="bottomCtrlBtnsWrapper">
                    <div className="btnGroup">
                        <Button
                            className={isAbleToSelfSubmitApprove ? "btnSave" : "btnSubmitAppr"}
                            variant='blue'
                            isDisabled={
                                !(isAbleToSelfSubmitApprove /*&& !(tableContent.ASGN_STS == 'PFU' || tableContent.ASGN_STS == 'PPFU')*/) &&
                                (!(tableContent.ASGN_STS == 'PE' || tableContent.ASGN_STS == 'EIP' || tableContent.ASGN_STS == 'FUI'
                                    || tableContent.ASGN_STS == 'PFUI' || tableContent.ASGN_STS == 'QSR' || tableContent.ASGN_STS == 'FQSR'
                                    || tableContent.ASGN_STS == 'PFQSR' || tableContent.ASGN_STS == 'PFU' || tableContent.ASGN_STS == 'PPFU'
                                ) ||
                                    (
                                        (tableContent.ASGN_STS == 'FUI' || tableContent.ASGN_STS == 'PPFU' || tableContent.ASGN_STS == 'PFU')
                                        &&
                                        tableContent?.QualityControlLogObject?.filter(qcObj => {
                                            return (qcObj.QC_TYP_UID == 4 || qcObj.QC_TYP_UID == 8) &&
                                                (qcObj.QC_STS == "I" || qcObj.QC_STS == "N")
                                        })?.length > 0
                                    ) || (
                                        tableContent?.InterviewLogListObject.filter(item => item.END_DT != null)?.length != tableContent.InterviewLogListObject?.length
                                    ))
                            }
                            onClick={() => setConfirmContent({
                                isOpen: true,
                                onClose: () => setConfirmContent({ isOpen: false }),
                                title: 'Confirmation',
                                msg: () => 'Are you sure to submit?',
                                onConfirm: () => {
                                    setConfirmContent({ isOpen: false })
                                    if (localStorage.getItem('IS_ONLINE') == 'false') {
                                        onChangeApprover(null)
                                        setAlertContent({
                                            isOpen: true,
                                            onClose: () => setAlertContent({ isOpen: false }),
                                            title: 'Error',
                                            msg: 'Approval work support online mode only',
                                        })
                                        return
                                    }
                                    else {
                                        handleUpdate('submit')
                                    }
                                }
                            })}
                        >
                            {
                                isAbleToSelfSubmitApprove ?
                                    <></>
                                    :
                                    !(tableContent.ASGN_STS == 'PE' || tableContent.ASGN_STS == 'EIP' || tableContent.ASGN_STS == 'FUI'
                                        || tableContent.ASGN_STS == 'PFUI' || tableContent.ASGN_STS == 'QSR' || tableContent.ASGN_STS == 'FQSR'
                                        || tableContent.ASGN_STS == 'PFQSR' || tableContent.ASGN_STS == 'PFU' || tableContent.ASGN_STS == 'PPFU'
                                    ) ||
                                        (
                                            (tableContent.ASGN_STS == 'FUI' || tableContent.ASGN_STS == 'PPFU' || tableContent.ASGN_STS == 'PFU')
                                            &&
                                            tableContent?.QualityControlLogObject?.filter(qcObj => {
                                                return (qcObj.QC_TYP_UID == 4 || qcObj.QC_TYP_UID == 8) &&
                                                    (qcObj.QC_STS == "I" || qcObj.QC_STS == "N")
                                            })?.length > 0
                                        ) || (
                                            tableContent?.InterviewLogListObject.filter(item => item.END_DT != null)?.length != tableContent.InterviewLogListObject?.length
                                        ) ?
                                        <Input
                                            className='approverList inputBox'
                                            value={`${tableContent?.SEL_APRV_STF_NAME_ENG ?? ''} - ${tableContent?.SEL_APRV_POSN_NAME_ENG ?? ''}`}
                                            isDisabled
                                        /> :
                                        <Select
                                            className="approverList inputBox"
                                            value={approverList.find(item => item?.STF_UID == tableContent?.SEL_APRV_STF_UID && item?.POSN_UID == tableContent?.SEL_APRV_POSN_UID)?.GUID ?? ''}
                                            isDisabled={
                                                // !approverList.find(item => item.STF_UID == user.STF_UID)
                                                // ||
                                                !(tableContent.ASGN_STS == 'PE' || tableContent.ASGN_STS == 'EIP'
                                                    || tableContent.ASGN_STS == 'FUI' || tableContent.ASGN_STS == 'PFUI'
                                                    || tableContent.ASGN_STS == 'QSR' || tableContent.ASGN_STS == 'FQSR'
                                                    || tableContent.ASGN_STS == 'PFQSR'
                                                    || tableContent.ASGN_STS == 'PFU' || tableContent.ASGN_STS == 'PPFU'
                                                )}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                onChangeApprover(e.target.value)
                                            }}
                                        >
                                            <option value={''}>Select approver</option>
                                            {
                                                approverList
                                                    .filter((approver) => approver?.STF_UID !== user.id)
                                                    .sort((a, b) => a.STF_NAME.localeCompare(b.STF_NAME))
                                                    .map((option) => (
                                                        <option value={option?.GUID}>{`${option?.STF_NAME} - ${option?.POSN_NAME}`}</option>
                                                    ))
                                            }
                                        </Select>
                            }
                            {/* <div>Submit for Approval</div> */}
                            <div>{
                                isAbleToSelfSubmitApprove
                                    ?
                                    "Submit and Approve" : "Submit for Approval"}
                            </div>
                        </Button>
                        {(user.isCET || user.isSupervisor) &&
                            <HoldAssignmentButton
                                assignmentList={[{ ...tableContent }]}
                                holdType={3}
                                isHold={!tableContent.HLD_STS || tableContent.HLD_STS != "H"}
                                dispatch={dispatch}
                                setAlertContent={setAlertContent}
                            />                        
                        }
                    </div>
                    <div className="btnGroup">
                        {
                            (tableContent.ASGN_STS == "QSP" || tableContent.ASGN_STS == "FQSP" || tableContent.ASGN_STS == "PFQSP" || tableContent.ASGN_STS == "EOEP" || tableContent.ASGN_STS == "EOFP" || tableContent.ASGN_STS == "EOPFP")
                            && user.position == tableContent.SEL_APRV_POSN_UID && user.id == tableContent.SEL_APRV_STF_UID && (
                                <>
                                    {tableContent.ASGN_STG_IND == "F" && (<Button className="btnSave" variant="yellow" onClick={() => handleUpdate("discard")} > Discard</Button>)}
                                    <Button className="btnSave" variant="red" onClick={() => handleUpdate("reject")} >Reject</Button>

                                    <Button className="btnSave" variant="blue" onClick={() => handleUpdate("approve")}>Approve</Button>
                                    {!needEOE && tableContent.ASGN_STG_IND != "F" && tableContent.ASGN_STG_IND != "PF" && (
                                        <Button className="btnSave" variant="blue" onClick={openApproveForm} >Edit Questionnaire</Button>
                                    )}
                                    {!needEOE && (
                                        // tableContent.CursoryCheckObject?.find(item => item.QC_STS == 'N' || item.QC_STS == 'C') &&
                                        <Button
                                            className="btnSave"
                                            variant="blue"
                                            onClick={() =>
                                                handleApprovewithQC()
                                            }
                                        >
                                            Approve with Cursory Check
                                        </Button>
                                    )}
                                </>
                            )}
                        {/* {
                            tableContent.ASGN_STS == "CMP" &&
                            (<Button variant="blue" onClick={() => handleUpdate("postSurvey")}>Submit for Post-survey Follow Up</Button>)
                        } */}
                        {
                            <Button
                                className="btnSave"
                                variant="blue"
                                onClick={() => {
                                    onSaveRemarks();
                                    // onSaveEOEReason()
                                }}
                            >
                                Save
                            </Button>
                        }
                    </div>
                </Box>
                {
                    delegateApprover && (<div className="delegateTxt">{`${delegateApprover.STF_NAME} has been appointed as the delegate for ${tableContent.SEL_APRV_STF_NAME_ENG} from ${delegateApprover.DELG_DT_FRM.split("T")[0]} to ${delegateApprover.DELG_DT_END.split("T")[0]}`}</div>)
                }
                {
                    reverseApprover && (<div className="delegateTxt">{`${reverseTarget.STF_NAME} has been appointed as the delegate for ${reverseApprover.STF_NAME} from ${reverseTarget.DELG_DT_FRM.split("T")[0]} to ${reverseTarget.DELG_DT_END.split("T")[0]}`}</div>)
                }
            </div>
            <AlertModal content={alertContent} />
            <ConfirmModal1 content={confirmContent} />
            {isViewActivity && (
                <DisplayDataModal
                    title={"Activities"}
                    onCloseModal={() => setIsViewActivity(false)}
                    isModalOpen={isViewActivity}
                    isFixSize={false}
                >
                    <div id="asngContactDetails" className="popupForm">
                        <DataTable
                            tableStructure={activity_tableStructure}
                            tableContent={
                                tableContent.AssignmentActivitesObject
                            }
                            variant={"roundedGreyHeaderOpenBottom"}
                            setTableContent={(content) => setTableContent((prevInput) => ({
                                ...prevInput,
                                AssignmentActivitesObject: content,
                            }))}
                            formContent={formContent}
                        />
                        {generatePageController(formContent?.offSet, formContent?.page, updateForm, 5, tableContent?.AssignmentActivitesObject?.length, formContent.pageSize)}
                    </div>
                </DisplayDataModal>
            )}
            {!!qcDetail && (
                <DisplayDataModal
                    title={`Quality Check`}
                    onCloseModal={() => setQcDetail(null)}
                    isModalOpen={qcDetail}
                    isFixSize={true}
                >
                    <CursoryCheckDetail
                        content={qcDetail}
                        onClose={() => setQcDetail(null)}
                    />
                </DisplayDataModal>
            )}
        </>
    );
}

function mapStateToProps(state) {
    const { assignment, common, workflow, questionnaire } = state;
    return {
        // data: assignment.assignmentDetailData,
        isLoading: common.isLoading,
        localState: assignment.localState,
        tabIndex: assignment.tabIndex,
        needFetch: common.needFetch,
        approverList: common.approverList,
        workFlowDispatchList: workflow.workFlowDispatchList,
        assignmentStatusList: common.assignmentStatusList,
        interviewModeList: common.interviewModeList,
        assignRefuseLvlList: common.assignRefuseLvlList,
        assignRefuseIndList: common.assignRefuseIndList,
        enumResultList: common.enumResultList,
        codingEditingMistakeList: common.codingEditingMistakeList,
        EndOfEnumerationReasonCodeList: common.EndOfEnumerationReasonCodeList,
        delegatedAssignmentApproverList: common.delegatedAssignmentApproverList,
        needCursory: questionnaire.needCursory,
    };
}

export default connect(mapStateToProps)(AssignmentDetail);

export const createNewAssignment = (guid, param, content, dispatch) => {
    const newAssignmentGUID = [...Array(parseInt(content.number))].map((item) => uuid());
    const newEFieldCardGUID = [...Array(parseInt(content.number))].map((item) => uuid());
    const user = tokenDecoder();

    getData("DCP", "assignment", guid).then((data) => {
        getAllData("DCP", "hhContact").then(async (contactList) => {
            const filteredContactList = contactList.filter((contact) => data.InterviewLogListObject?.some((interviewLog) => interviewLog.HH_CONT_GUID == contact.GUID));
            //Assignment
            const tempContactList = [];
            const clonedAssignmentList = newAssignmentGUID.map(
                (guid, index) => {
                    filteredContactList.map((contact) =>
                        tempContactList.push({
                            ...contact,
                            GUID: uuid(),
                            HH_CONT_UID: null,
                            origin_GUID: contact.GUID,
                            ASGN_GUID: guid,
                        })
                    );
                    return {
                        ...data,
                        // ...param[index],
                        ...content.pNewAssignmentList[index],
                        GUID: guid,
                        ASGN_STS: "PE",
                        AppointmentBookingObject: [],
                        AssignmentActivitesObject: [],
                        ContactObject: tempContactList.filter((contact) => contact.ASGN_GUID == guid).map((item) => ({ GUID: item.GUID, SEQ_NO: 999 })),
                        EnquiryLogObject: [],
                        AssignmentDetailObject: [
                            {
                                ...data.AssignmentDetailObject[0],
                                GUID: guid,
                                ASGN_UID: null,
                                RemarkList: [],
                                OfficerList: [
                                    {
                                        NAME_CHI: user.name_chi,
                                        NAME_ENG: user.name,
                                        POSN_CD: user.position,
                                        POSN_RNK: user.rank,
                                        STF_UID: user.id,
                                    },
                                ],
                            },
                        ],
                        EFieldCardObject: [
                            {
                                EFC_UID: null,
                                GUID: newEFieldCardGUID[index],
                            },
                        ],
                        ASGN_UID: null,
                        //Mantis 3453: decided not to copy interview log
                        // InterviewLogListObject: data.InterviewLogListObject.map(
                        //     (interviewlog) => ({
                        //         ...interviewlog,
                        //         GUID: uuid(),
                        //         INTV_LOG_UID: null,
                        //         HH_CONT_GUID: tempContactList
                        //             .filter(
                        //                 (contact) => contact.ASGN_GUID == guid
                        //             )
                        //             .find(
                        //                 (contact) =>
                        //                     contact.origin_GUID ==
                        //                     interviewlog.HH_CONT_GUID
                        //             )?.GUID,
                        //         HH_CONT_UID: null,
                        //     })
                        // ),
                        MAIN_ASGN_UID: data.ASGN_UID,
                    };
                }
            );

            await addData("DCP", "assignment", clonedAssignmentList, "GUID", false);

            await updateData("DCP", "assignment", data.GUID, null, { ...data, ...content.pMainAssignmentAddress, GUID: data.GUID, });

            //Handle API Assignment
            const assignmentSubmitData = {
                pAssignmentGuid: data.GUID,
                pStaffPositionUid: user?.stf_position,
                pAssignmentType: content.pAssignmentType,
                pSearchIndicator: content.pSearchIndicator,
                pMainAssignmentAddress: {
                    // Conditionally add QTR_TYP_CD if it's not null
                    ...content.pMainAssignmentAddress,
                    QTR_TYP_CD: content.pMainAssignmentAddress.QTR_TYP_CD ? content.pMainAssignmentAddress.QTR_TYP_CD : undefined,
                },
                pNewAssignmentList: content.pNewAssignmentList.map((item, index) => {
                    const newItem = {
                        ...item,
                        ASGN_GUID: newAssignmentGUID[index],
                        QTR_TYP_CD: item.QTR_TYP_CD ? item.QTR_TYP_CD : undefined,
                    };
                    return newItem;
                }
                ),
            };

            await dispatch(cloneSubAssignment(assignmentSubmitData));

            //HH Contact
            const contactSubmitData = {
                cm_asgn_hh_cont_setList: tempContactList.map((contact) => ({
                    RecordState: "I",
                    HH_CONT_UID: null,
                    ASGN_UID: null,
                    ASGN_GUID: contact.ASGN_GUID,
                    SEQ_NO: contact.SEQ_NO,
                    GUID: contact.GUID,
                    ENQ_IND: contact.ENQ_IND,
                    INTV_IND: contact.INTV_IND,
                    APPT_IND: contact.APPT_IND,
                    APPT_REQR_IND: contact.APPT_REQR_IND,
                    TITL: contact.TITL,
                    NAME_ENG: contact.NAME_ENG,
                    NAME_CHI: contact.NAME_CHI,
                    TEL_1: contact.TEL_1,
                    TEL_2: contact.TEL_2,
                    EML: contact.EML,
                    EML_IND: contact.EML_IND,
                    RMKS: contact.RMKS,
                    CONT_METH_PREF: contact.CONT_METH_PREF,
                    STS: contact.CONT_METH_PREF,
                    origin_GUID: contact.GUID,
                })),
            };
            const indexDBContactList = tempContactList.map((contact) => ({
                APPT_IND: contact.APPT_IND,
                APPT_REQR_IND: contact.APPT_REQR_IND,
                CONT_METH_PREF: contact.CONT_METH_PREF,
                CONT_METH_PREF_DESCR: contact.CONT_METH_PREF_DESCR,
                CRE_SYS_CD: moment().toISOString(),
                EML: contact.EML,
                ENQ_IND: contact.ENQ_IND,
                GUID: contact.GUID,
                HH_CONT_UID: contact.HH_CONT_UID,
                INTV_IND: contact.INTV_IND,
                NAME_ENG: contact.NAME_ENG,
                RMKS: contact.RMKS,
                SEQ_NO: contact.SEQ_NO,
                STS: contact.STS,
                TEL_1: contact.TEL_1,
                TITL: contact.TITL,
                UPD_DT: moment().toISOString(),
            }));
            // addData('DCP', 'hhContact', indexDBContactList, 'GUID', false)

            await dispatch(updateAssignment(contactSubmitData));

            //Handle API Interview Log
            const interviewLogList = [];
            const interviewLogPhotoList = [];
            clonedAssignmentList.map((assign) => {
                assign?.InterviewLogListObject?.map((interviewLog) => {
                    interviewLogList.push({
                        ...interviewLog,
                        RecordState: "I",
                        ASGN_UID: assign.ASGN_UID,
                        ASGN_GUID: assign.GUID,
                        PHT_LST: [],
                        POSN_UID: user?.position,
                        STF_UID: user?.id,
                        STF_NO: user?.stf_no,
                    });
                    interviewLog?.PHT_LST?.map((photo) => {
                        interviewLogPhotoList.push({
                            ...photo,
                            RecordState: "I",
                            CRE_SYS_CD: "DCP",
                            UPD_SYS_CD: "DCP",
                            INTV_LOG_UID: null,
                            INTV_LOG_GUID: interviewLog.GUID,
                        });
                    });
                });
            });
            const interviewLogSubmitData = {
                InterviewLogSetupList: interviewLogList,
                InterviewLogPhotoSetupList: interviewLogPhotoList.map((item) => ({ ...item, FILE_PATH: null })),
            };

            await dispatch(setInterviewLog(interviewLogSubmitData));


            // Mantis 4890 - no need to call UpdateEFieldCard API
            // //E-Field Card
            // getData("DCP", "eFieldCard", data?.EFieldCardObject[0]?.GUID).then(
            //     async (eFieldCard) => {
            //         const clonedEFieldCardList = newEFieldCardGUID.map(
            //             (guid, index) => ({
            //                 ...eFieldCard,
            //                 GUID: guid,
            //                 EFC_UID: null,
            //                 EFieldCardAssignmentListObject: [
            //                     clonedAssignmentList[index],
            //                 ],
            //                 EFieldCardContactObject: [],
            //                 EFieldCardRemarksObject: [],
            //                 EFieldCardSpecificInfoImageObject: [],
            //                 EFieldCardSpecificInfoObject: [],
            //                 EFieldCardVisitRecordObject: [],
            //             })
            //         );

            //         await pAddData("DCP", "eFieldCard", clonedEFieldCardList, "GUID", false);
            //         //Handle API
            //         const tempEFieldCardAssignment = [];
            //         clonedEFieldCardList.map((item) => {
            //             item.EFieldCardAssignmentListObject.map((assign) => {
            //                 tempEFieldCardAssignment.push({
            //                     EFC_UID: null,
            //                     EFC_GUID: item.GUID,
            //                     ASGN_UID: assign.ASGN_UID,
            //                     ASGN_GUID: assign.GUID,
            //                     HD_SQUAT_CTRL_NO: assign.HD_SQUAT_CTRL_NO,
            //                     SEG_RMKS: assign.SEG_RMKS,
            //                     RecordState: "I",
            //                 });
            //             });
            //         });
            //         const eFieldCardSubmitData = {
            //             EFieldCard: clonedEFieldCardList.map((item) => ({
            //                 RecordState: "I",
            //                 GUID: item.GUID,
            //                 EFC_UID: null,
            //                 EFC_TYP: "H",
            //                 STS: "A",
            //             })),
            //             EFieldCardAssignment: tempEFieldCardAssignment,
            //         };

            //         await dispatch(updateEFieldCard(eFieldCardSubmitData));
            //     }
            // );

            //Segment Control
            getAllData("DCP", "segmentControl").then((segmentControlList) => {
                const tempSegmentControlList = Object.assign([], segmentControlList);
                const targetSegmentControl = tempSegmentControlList.find((segmentControl) => segmentControl.SC_UID == data.SRVY_CYCLE_UID && segmentControl.SEG_UID == data.SEG_UID);
                if (!targetSegmentControl) return;

                const { MAIL_ADDR_CHI_1, MAIL_ADDR_CHI_2, MAIL_ADDR_CHI_3, MAIL_ADDR_CHI_4, MAIL_ADDR_CHI_5, MAIL_ADDR_CHI_6, MAIL_ADDR_ENG_1, MAIL_ADDR_ENG_2, MAIL_ADDR_ENG_3, MAIL_ADDR_ENG_4, MAIL_ADDR_ENG_5, MAIL_ADDR_ENG_6, BLDG_TYP_DESCR, DCCA_ENG, } = data;

                // const { MAIL_ADDR_CHI_1, MAIL_ADDR_CHI_2, MAIL_ADDR_CHI_3, MAIL_ADDR_CHI_4, MAIL_ADDR_CHI_5, MAIL_ADDR_ENG_1, MAIL_ADDR_ENG_2, MAIL_ADDR_ENG_3, MAIL_ADDR_ENG_4, MAIL_ADDR_ENG_5, BLDG_TYP, DCCA_ENG } = data
                newAssignmentGUID.map((assignmentGUID, index) => {
                    targetSegmentControl.EFieldCardSegmentControlListQuartersObject.push(
                        {
                            ...{ MAIL_ADDR_CHI_1, MAIL_ADDR_CHI_2, MAIL_ADDR_CHI_3, MAIL_ADDR_CHI_4, MAIL_ADDR_CHI_5, MAIL_ADDR_CHI_6, MAIL_ADDR_ENG_1, MAIL_ADDR_ENG_2, MAIL_ADDR_ENG_3, MAIL_ADDR_ENG_4, MAIL_ADDR_ENG_5, MAIL_ADDR_ENG_6, BLDG_TYP_DESCR, DCCA_ENG, },

                            // ...{ MAIL_ADDR_CHI_1, MAIL_ADDR_CHI_2, MAIL_ADDR_CHI_3, MAIL_ADDR_CHI_4, MAIL_ADDR_CHI_5, MAIL_ADDR_ENG_1, MAIL_ADDR_ENG_2, MAIL_ADDR_ENG_3, MAIL_ADDR_ENG_4, MAIL_ADDR_ENG_5, BLDG_TYP, DCCA_ENG },
                            EFC_GUID: newEFieldCardGUID[index],
                            EFC_UID: null,
                            SEG_RMKS: "",
                            HD_SQUAT_CTRL_NO: null,
                            ENUM_RSLT_CD: null,
                            ASGN_GUID: assignmentGUID,
                            ASGN_UID: null,
                        }
                    );
                });
                updateData("DCP", "segmentControl", targetSegmentControl.GUID, null, targetSegmentControl);
            });
            dispatch(triggerFetch());
        });
    });
};

export const HoldAssignmentButton = ({ assignmentList, holdType, isHold, dispatch, setAlertContent, }) => {
    const [holdContent, setHoldContent] = useState({});
    const [isOpen, setIsOpen] = useState(false);
    const [confirmContent, setConfirmContent] = useState({});

    const onHoldAssignment = async () => {
        const submitData = [];

        await new Promise((resolve, reject) => {
            assignmentList.map((assignment) => {
                //updateData("DCP", "assignment", assignment.GUID, "HLD_STS", isHold ? "H" : holdType == 1 || holdType == 2 ? "R" : "D"); 
                updateData("DCP", "assignment", assignment.GUID, "HLD_STS", isHold ? "H" : "R");

                submitData.push({
                    RecordState: isHold && !assignment.HLD_TYP ? "I" : "U",
                    ASGN_UID: assignment.ASGN_UID,
                    ASGN_GUID: assignment.GUID,
                    HLD_TYP: holdType,
                    HLD_RSN: holdContent?.HLD_RSN,
                    // HLD_STS: isHold ? "H" : holdType == 1 || holdType == 2 ? "R" : "D",
                    HLD_STS: isHold ? "H" : "R",

                });
            });
            resolve();
        });

        // const submitData = {
        //     cm_asgn_hld_lst_setList: assignmentList.map(assignment => ({

        //     }))
        // }
        await checkNet(dispatch(updateAssignment({ cm_asgn_hld_lst_setList: submitData })));
        onCloseModal();
        dispatch(triggerFetch());
    };

    const onChangeUpdateForm = (key, value, type) => {
        let tempValue = { [key]: type == "time" ? moment(content[key]).set("hour", value.split(":")[0]).set("minute", value.split(":")[1]).toISOString(true) : value, };

        setHoldContent((prev) => ({
            ...prev,
            ...tempValue,
        }));
    };

    const onUnholdAssignment = () => {
        setConfirmContent({
            isOpen: true,
            title: "Confirmation",
            msg: () => "Are you sure to unhold selected assignment(s)?",
            onClose: () => {
                setConfirmContent({
                    isOpen: false,
                    msg: "",
                    onClose: null,
                    onConfirm: null,
                });
            },
            onConfirm: async () => {
                await onHoldAssignment();
                setConfirmContent({
                    isOpen: false,
                    msg: "",
                    onClose: null,
                    onConfirm: null,
                });
            },
        });
    };

    const onCloseModal = () => {
        setIsOpen(false);
        setHoldContent({});
    };

    const handleClick = () => {
        if (!assignmentList?.length) {
            setAlertContent({
                isOpen: true,
                title: "Warning",
                msg: "No assignment is selected.",
                onClose: () => {
                    setAlertContent({
                        isOpen: false,
                        msg: "",
                        onClose: null,
                    });
                },
            });
            return;
        }

        if (isHold) {
            setIsOpen(true);
        } else {
            onUnholdAssignment();
        }
    };

    return (
        <>
            <Button variant="blue" onClick={handleClick}>
                {isHold ? "Hold" : "Unhold"}
            </Button>
            <DisplayDataModal
                title={`Hold`}
                onCloseModal={onCloseModal}
                isModalOpen={isOpen}
                isFixSize={true}
            >
                <DataForm
                    tableStructure={[
                        {
                            header: "Reason",
                            inputType: "textarea",
                            key: "HLD_RSN",
                        },
                    ]}
                    content={holdContent}
                    updateFormAction={onChangeUpdateForm}
                    submitAction={onHoldAssignment}
                />
            </DisplayDataModal>
            <ConfirmModal1 content={confirmContent} />
        </>
    );
};
