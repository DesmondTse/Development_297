import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    Box,
    IconButton,
    Input,
    Select,
    Container,
    Table,
    Thead,
    Tr,
    Th,
    Td,
    Tbody,
    Checkbox,
    Tooltip,
} from '@chakra-ui/react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import DataForm from '../../component/DataForm';

import DataTable from '../../component/DataTable';
import { getInterviewLogByPage, getInterviewLogDetailByUid } from '../../features/slices/interviewLogSlice';
import { updateState } from '../../features/slices/assignmentSlice';
import { getDataConflictByAssignmentUid, getSubmissionByAssignmentUidAndVerNo, updateQuestionnaire, updateQuestionnaireState } from '../../features/slices/questionnaireSlice';
// import { Container } from 'react-bootstrap';
import { DisplayDataModal } from "../../component/DisplayDataModal";
import InterviewlogDetail from "../interviewLog/InterviewlogDetail";
import { getData, updateData } from "../../utils/idbUtils";
import { generatePageController } from "../../utils/tableUtils";
import { EditIcon } from "@chakra-ui/icons";
import QuestionaireForm from "../questionnaire/QuestionaireForm";
import { Formio, Utils } from "formiojs";
import { createNewAssignment } from "../assignment/AssignmentDetail";
import uuid from "react-uuid";
import { AlertModal } from "../../component/AlertModal";
import { Button } from "../../component/Button";
import { setInterviewLog } from "../../features/slices/interviewLogSlice";
import { checkNet, tokenDecoder } from "../../utils/networkUtils";
import { triggerFetch } from "../../features/slices/commonSlice";
import { ConfirmModal1 } from "../../component/ConfirmModal1";
import { isEmpty } from "lodash";
import { CURRENT_FCN_UID } from "../../features/axiosInterceptors";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { QuestionnairePreviewTable } from '../questionnaire/QuestionnairePreviewTable';
import { QuestionnairePrefillTable } from '../questionnaire/QuestionnairePrefillTable';

/** 8706 */
import { useSubmitVersionStructure } from '../../hooks/useSubmitVersionStructure';
import { useQuestionnaireHandlers } from '../../hooks/useQuestionnaireHandlers';

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
}

function InterviewLog(props) {
    const navigate = useNavigate();
    const {
        data,
        dispatch,
        content,
        localState,
        formIOSchema,
        contactList,
        newAssignmenTypeList,
        quartersTypeList,
        searchIndexList,
        interviewModeList,
        assignmentList,
        SubmissionVersionObject,
        contactLanguageList,
        intentionOQList,
        assignRefuseLvlList,
        contactPrefList,
        contactTimePrefList,
        assignRefuseIndList,
        enumResultList,
        ReferTIFailReasonList,
        submissionVersion,
        setSubmissionVersion,
        errList,
        followUpList,
        questionnaireDataStatusList,
        questionnaireDataTypeList,
        lastRoundData,
        EnumerationModesList,
        contactTitleList,
        isQuestionnaireDataReady,
        setIsQuestionnaireDataReady,
        pageSrc
    } = props;
    const [tableContent, setTableContent] = useState([]);
    const [assignment, setAssignment] = useState({});

    const [formContent, setFormContent] = useState({
        pageSize: 10,
        page: 1,
        offSet: 0,
    });
    const { id } = useParams();
    const [startTime, setStartTime] = useState(new Date());
    const [detailId, setDetailId] = useState(null);
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isOpenFormModal, setIsOpenFormModal] = useState(false);
    const [isQuestionairePreview, setIsQuestionairePreview] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [interviewLogDetailContent, setInterviewLogDetailContent] = useState(
        {}
    );
    const [formSchema, setFormSchema] = useState({});
    const [newAssignmentContent, setNewAssignmentContent] = useState({
        isOpen: false,
        number: 1,
        steps: 1,
    });
    const [alertContent, setAlertContent] = useState({});
    const [imageDetail, setImageDetail] = useState({});
    const [startInterviewContent, setStartInterviewContent] = useState({
        isOpen: false,
        INTV_MDE: '',
    });
    const [confirmContent, setConfirmContent] = useState(false);
    const [currentVersion, setCurrentVersion] = useState(0);
    const firstContentRender = useRef(true);
    const [isDisplayDownload, setIsDisplayDownload] = useState(false);
    const [isOnline, setIsOnline] = useLocalStorage('IS_ONLINE');
    const menuList = useMemo(() => {
        return JSON.parse(localStorage.getItem('menu'));
    }, []);
    const [latestEndLog, setLatestEndLog] = useState(null);

    const [prefillSchema, setPrefillSchema] = useState(null)
    const [prefillFormContent, setPrefillFormContent] = useState([])
    const [prefillLocale, setPrefillLocale] = useState('zh')
    const [prefillLatestVersion, setPrefillLatestVersion] = useState(null)
    const [verifyDetail, setVerifyDetail] = useState(null)
    const [type, setType] = useState('preview')

    const formStructure = [
        {
            header: 'Latest Visit Mode',
            inputType: 'text-select',
            key: 'LST_VST_MDE',
            list: interviewModeList,
            contentKey: 'LST_VST_MDE',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Latest Visit Result',
            inputType: 'text-select',
            key: 'LST_ENUM_RSLT_CD',
            list: enumResultList,
            contentKey: 'LST_ENUM_RSLT_CD',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Last Visit Time',
            inputType: 'date-time',
            key: 'LST_VST_TM',
        },
        {
            header: 'Last Visit By',
            inputType: 'text',
            key: 'LST_VST_PSN',
        },
        {
            header: '#NC T/D/N',
            inputType: 'custome',
            key: '',
            cell: (content) => `${content.NCD_SUM + content.NCN_SUM}
                    /${content.NCD_SUM}
                    /${content.NCN_SUM}`,
        },
    ];

    const preference_formStructure = [
        {
            header: 'Respondent\'s Attitude and Language',
            inputType: 'text-select',
            key: 'LST_RESPT_LNG',
            list: contactLanguageList,
            contentKey: 'LST_RESPT_LNG',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Refusal Ind.',
            inputType: 'text-select',
            key: '',
            list: assignRefuseIndList,
            contentKey: 'LST_RFSL_IND',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Intention Using OQ Next Round',
            inputType: 'text-select',
            key: 'LST_INT_OQ_IND_DESCR',
            list: intentionOQList,
            contentKey: 'LST_INT_OQ_IND',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Refusal Level',
            inputType: 'text-select',
            key: '',
            list: assignRefuseLvlList,
            contentKey: 'LST_RFSL_LVL',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Contact Mode Preference',
            inputType: 'text-select',
            key: '',
            list: contactPrefList,
            contentKey: 'LST_CONT_METH_PREF',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Updated Date',
            inputType: 'date-time',
            key: 'LST_CONT_UPD_DT',
        },
        {
            header: 'Contact Time Preference',
            inputType: 'text-select',
            key: 'LST_PREF_TIME_DESCR',
            list: contactTimePrefList,
            contentKey: 'LST_PREF_TIME',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Updated By',
            inputType: 'text',
            key: 'LST_CONT_UPD_BY',
        },
    ];
    const user = useMemo(() => tokenDecoder(), []);

    const tableStructure = [
        {
            header: 'Action',
            inputType: 'custome',
            key: '',
            cell: (content) => {
                return assignment.ASGN_STS == 'EOEP' /*|| assignment.ASGN_STS == 'EOEA'*/ ? undefined : (
                    <div className="grey_icon_wrapper">
                        <Tooltip label="Edit">
                            <div className="icon_edit_1" onClick={() => onClickInterviewLog(content['GUID'])}></div>
                        </Tooltip>
                        <Tooltip label="Delete">
                            <div className="icon_delete_2" onClick={() => onDeleteInterviewLog(content['GUID'])}></div>
                        </Tooltip>
                        {content.END_DT == null && /*(user.RESP_STF_UID == assignment.RESP_STF_UID ||*/ user.id == content.STF_UID ? (
                            <Tooltip label="End Interview">
                                <div className="icon_done_2"
                                    onClick={() => onEndInterviewLog(content['GUID'])}
                                ></div>
                            </Tooltip>
                        )
                            :
                            undefined
                        }
                    </div>
                );
                // return <IconButton aria-label='editButton' ic    on={<EditIcon />} onClick={() => onClickInterviewLog(content[object_key] ? content[object_key] : content['UUID'])} />
            },
        },
        // {
        //     header: 'Interview Log#',
        //     inputType: 'text',
        //     key: 'INTV_LOG_UID',
        //     isNumber: true,
        //     sortSeq: 1
        // },
        {
            header: 'Interview Date',
            inputType: 'text-date',
            key: 'DT',
            isMinW: true,
            sortSeq: 3,
        },
        // {
        //     header: 'Mode',
        //     inputType: 'text-select',
        //     contentKey: 'INTV_MDE',
        //     targetKey: 'value',
        //     displayKey: 'label',
        //     list: interviewModeList,
        //     key: 'INTV_MDE',
        //     isMinW: true,
        //     sortSeq: 2,
        // },
        {
            header: 'Interview Start Time',
            inputType: 'text-time',
            key: 'STRT_TM',
        },
        {
            header: 'Interview End Time',
            inputType: 'text-time',
            key: 'END_DT',
        },
        {
            header: 'Interview Mode',
            inputType: 'text-select',
            key: 'INTV_MDE',
            list: interviewModeList,
            contentKey: 'INTV_MDE',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Interview Result',
            inputType: 'text-select',
            key: 'ENUM_RSLT_CD',
            list: enumResultList?.filter((item) => item.SRVY_UID == assignment.SRVY_UID),
            contentKey: 'ENUM_RSLT_CD',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Unsuccessful Telephone Interview Reason',
            inputType: 'text-select',
            key: 'TI_FAIL_RSN_CD',
            list: ReferTIFailReasonList,
            contentKey: 'TI_FAIL_RSN_CD',
            targetKey: 'value',
            displayKey: 'label',
        },
        {
            header: 'Interview Remarks',
            inputType: 'text',
            key: 'INTV_RMKS',
            isMinW: true,
        },
        {
            header: 'Contact Person',
            inputType: 'text-select',
            key: '',
            list: contactList,
            targetKey: 'GUID',
            contentKey: 'HH_CONT_GUID',
            displayKey: 'NAME_ENG',
        },
        {
            header: 'Respondent Title',
            inputType: 'custome',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'TITL',
            cell: (content) => {
                const detailContent = contactList.find((obj) => obj.HH_CONT_UID == content.HH_CONT_UID);
                return (contactTitleList.find((obj) => obj.value === detailContent?.TITL)?.label ?? '-');
            },
        },
        {
            header: 'Respondent Name (Eng)',
            inputType: 'text-select',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'NAME_ENG',
        },
        {
            header: 'Respondent Name (Chi)',
            inputType: 'text-select',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'NAME_CHI',
        },
        // {
        //     header: 'Respondent Tel. no. 1',
        //     inputType: 'encrpyted-tel',
        //     key: 'TEL_1',
        //     encryptIndex: 4,
        // },
        // {
        //     header: 'Respondent Tel. no. 2',
        //     inputType: 'encrpyted-tel',
        //     key: 'TEL_2',
        //     encryptIndex: 4,
        // },
        {
            header: 'Respondent Tel. No.1 - Ext.',
            inputType: 'text-phone',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: ['TEL_1', 'TEL_EXT_1'],
            encryptIndex: 4,
        },
        {
            header: 'Respondent Tel. No.2 - Ext.',
            inputType: 'text-phone',
            key: 'TEL_EXT_2',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: ['TEL_2', 'TEL_EXT_2'],
            encryptIndex: 4,
        },
        {
            header: 'Respondent Email',
            inputType: 'text-select',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'EML',
        },
        {
            header: 'Respondent\'s Attitude and Language Used',
            inputType: 'text-select',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'RESPT_LNG_DESCR',
        },
        {
            header: 'Intention Using OQ Next Round',
            inputType: 'text-select',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'INT_OQ_IND_DESCR',
        },
        {
            header: 'Contact Mode Preference',
            inputType: 'text-select',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'CONT_METH_PREF_DESCR',
        },
        {
            header: 'Contact Time Preference',
            inputType: 'text-select',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'PREF_TIME_DESCR',
        },
        {
            header: 'Refusal Ind.',
            inputType: 'text-select',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'RFSL_IND_DESCR',
        },
        {
            header: 'Refusal Level',
            inputType: 'text-select',
            key: '',
            list: contactList,
            contentKey: 'HH_CONT_GUID',
            targetKey: 'GUID',
            displayKey: 'RFSL_LVL_DESCR',
        },
        {
            header: 'View Image',
            inputType: 'custome',
            key: '',
            cell: (content) => <Button variant="blue" onClick={() => onClickViewImageList(content?.GUID)}>View</Button>

        },
        {
            header: 'Created Date',
            inputType: 'text-date-time',
            key: 'CRE_DT',
        },
        {
            header: 'Created By',
            inputType: 'text',
            key: 'CRE_BY_NAME_ENG',
        },
        {
            header: 'Updated Date',
            inputType: 'text-date-time',
            key: 'UPD_DT',
        },
        {
            header: 'Updated By',
            inputType: 'text',
            key: 'UPD_BY_NAME_ENG',
        },
    ];

    const newAssignmentContentStructure = [
        {
            header: 'Type',
            inputType: 'select',
            key: 'pAssignmentType',
            list: newAssignmenTypeList.filter((item) => item.SRVY_UID == assignment.SRVY_UID)?.map((item) => { return { value: item.NEW_ASGN_TYP, label: item.DESCR, SRVY_UID: item.SRVY_UID, }; }),
            isRequired: true
        },
        {
            header: 'Number',
            inputType: 'input',
            key: 'number',
            isNumber: true,
        },
    ];

    const newAssignmentCurrentAddressStructure = [
        {
            header: 'Quarters Type',
            inputType: (newAssignmentContent.pAssignmentType == 'BLD' || newAssignmentContent.pAssignmentType == 'QTR' || newAssignmentContent.pAssignmentType == 'ATT') ? 'select' : 'none',
            key: 'QTR_TYP_CD',
            list: quartersTypeList.map(({value,label})=>({value:value, label: value + " - " + label})),
        },
        {
            header: 'Address (Eng)',
            inputType: 'multi-address',
            key: [
                'MAIL_ADDR_ENG_1',
                'MAIL_ADDR_ENG_2',
                'MAIL_ADDR_ENG_3',
                'MAIL_ADDR_ENG_4',
                'MAIL_ADDR_ENG_5',
                'MAIL_ADDR_ENG_6',
            ],
        },
        {
            header: 'Address (Chi)',
            inputType: 'multi-address',
            key: [
                'MAIL_ADDR_CHI_1',
                'MAIL_ADDR_CHI_2',
                'MAIL_ADDR_CHI_3',
                'MAIL_ADDR_CHI_4',
                'MAIL_ADDR_CHI_5',
                // 'MAIL_ADDR_CHI_6',
            ],
        },
    ];

    const startInterviewContent_structure = [
        {
            header: 'Interview Mode',
            inputType: 'select',
            key: 'INTV_MDE',
            list: interviewModeList,
        },
    ];

    /** code moved to the bottom 8706 */
    // const submitVersionStructure = [
    //     {
    //         // header: 'Submit Version',
    //         header: '',
    //         inputType: 'custome',
    //         key: '',
    //         cell: (content) => (
    //             <Checkbox isChecked={currentVersion == content.Q_DATA_VER_NO} isDisabled={!isOnline || (assignment.ASGN_STS != 'PE' && assignment.ASGN_STS != 'EIP' && assignment.ASGN_STS != 'QSR')} onChange={(e) => {
    //                 setCurrentVersion(content.Q_DATA_VER_NO);
    //             }} />
    //         ),
    //     },
    //     {
    //         header: 'Version',
    //         inputType: 'text',
    //         key: 'Q_DATA_VER_NO',
    //     },
    //     {
    //         header: isDisplayDownload ? 'Download' : '',
    //         inputType: isDisplayDownload ? 'custome' : 'none',
    //         key: '',
    //         cell: (content) => (
    //             <Button
    //                 variant={'blue'}
    //                 onClick={() => downloadJSON(content)}
    //             >
    //                 Download JSON
    //             </Button>
    //         ),
    //     },
    //     {
    //         header: 'Preview',
    //         inputType: 'custome',
    //         key: '',
    //         cell: (content) => {
    //             const submissionList = [assignment?.submission, assignment?.indoorSubmission, assignment?.followupSubmission, assignment?.fieldSubmission,];
    //             const target = submissionList.filter((item) => item?.length).flat().find((item) => assignment.TEMP_DOC_REF_NO == item.Form_ID && item.Version == content.Q_DATA_VER_NO);
    //             return (
    //                 <Button
    //                     variant={'blue'}
    //                     onClick={() => navigatePreview(content)}
    //                     isDisabled={!isOnline && !target}
    //                 >
    //                     Preview
    //                 </Button>
    //             );
    //         },
    //     },
    //     {
    //         header: 'Review',
    //         inputType: 'custome',
    //         key: '',
    //         cell: (content) =>
    //             content.Q_DATA_TYP != "RAWA" && (content.RVW_STS == 'P' || content.RVW_STS == 'D' ) && [...(assignment.AssignmentDetailObject?.[0].OfficerList ?? []), ...(assignment.AssignmentDetailObject?.[0].SupervisorList ?? []),].some((item) => item.STF_POSN_UID == tokenDecoder().stf_position) && (
    //                 <Button variant={'yellow'} onClick={() => navigateDataConflict(content)} >
    //                     Review
    //                 </Button>
    //             ),
    //     },
    //     {
    //         header: 'Compare Pre-filled',
    //         inputType: 'custome',
    //         key: '',
    //         cell: (content) => {
    //             const submissionList = [assignment?.submission, assignment?.indoorSubmission, assignment?.followupSubmission, assignment?.fieldSubmission]
    //             const target = submissionList.filter(item => item?.length).flat().find(item => assignment.TEMP_DOC_REF_NO == item.Form_ID && item.Version == content.Q_DATA_VER_NO)
    //             return assignment?.lastRoundSubmission?.length > 0 && <Button
    //                         variant={'blue'}
    //                         onClick={() => navigatePrefill(content,true)}
    //                         isDisabled={!isOnline && !target}
    //                     >
    //                         Compare
    //                     </Button>
    //         },
    //     },
    //     {
    //         header: "Questionnaire Data Type",
    //         inputType: "text-select",
    //         key: "Q_DATA_TYP",
    //         contentKey: "Q_DATA_TYP",
    //         targetKey: "value",
    //         displayKey: "label",
    //         list: questionnaireDataTypeList,
    //     },
    //     {
    //         header: 'Data Conflict Status',
    //         inputType: 'text',
    //         key: 'DF_STS_DESCR',
    //     },
    //     {
    //         header: 'Complete/Partial',
    //         inputType: 'text-select',
    //         key: 'Q_DATA_STS',
    //         contentKey: 'Q_DATA_STS',
    //         targetKey: 'value',
    //         displayKey: 'label',
    //         list: questionnaireDataStatusList,
    //     },
    //     {
    //         header: 'Enum Mode',
    //         inputType: 'text-select',
    //         key: 'ENUM_MDE',
    //         contentKey: 'ENUM_MDE',
    //         targetKey: 'value',
    //         displayKey: 'label',
    //         list: EnumerationModesList.map(item => item.value === "P" ? { value: item.value, label: null } : item)
    //     },
    //     {
    //         header: 'Created By',
    //         inputType: 'text',
    //         key: 'CRE_BY',
    //     },
    //     {
    //         header: 'Create Time',
    //         inputType: 'text-date-time',
    //         key: 'CRE_DT',
    //     },
    //     {
    //         header: 'Review Status',
    //         inputType: 'text',
    //         key: 'RVW_STS_DESCR',
    //     },
    //     {
    //         header: 'Review By',
    //         inputType: 'text',
    //         key: 'RVW_BY_STF_NAME_ENG',
    //     },
    //     {
    //         header: 'Review Time',
    //         inputType: 'text-date',
    //         key: 'RVW_DT',
    //     },
    //     {
    //         header: 'Updated By',
    //         inputType: 'text',
    //         key: 'UPD_BY',
    //     },
    //     {
    //         header: 'Updated Time',
    //         inputType: 'text-date-time',
    //         key: 'UPD_DT',
    //     },
    // ];

    const imageDetailDataFormStructure = [
        {
            inputType: 'image',
            key: 'IMG_BASE64',
        },
        {
            header: 'Name',
            inputType: 'text',
            key: 'FILE_NAME',
        },
        {
            header: 'Remark',
            inputType: 'textarea',
            key: 'FILE_DESCR',
        },
    ];

    const imageDetailTableStructure = [
        {
            header: 'Name',
            inputType: 'text',
            key: 'FILE_NAME',
        },
        {
            header: 'Remark',
            inputType: 'text',
            key: 'FILE_DESCR',
        },
        {
            header: '',
            inputType: 'custome',
            key: '',
            cell: (content) => {
                return (
                    <a onClick={() => onClickImage(content)}><Button variant='blue'>View</Button></a>);
            },
        },
    ];

    useEffect(() => {
        const user = tokenDecoder();
        const curPos = menuList?.find((item) => item.POSN_UID == user.position);
        if (curPos) {
            setIsDisplayDownload(curPos.CET_IND == 'Y' ? true : false);
        }
    }, []);

    useEffect(() => {
        if (content) {
            setTableContent(content.map((item) => {
                const contact = contactList.find((c) => c.GUID == item.HH_CONT_GUID);
                if (contact) {
                    return {
                        ...item,
                        TEL_1: contact.TEL_1,
                        TEL_2: contact.TEL_2,
                    };
                } else {
                    return { ...item };
                }
            })
            );
            if (content.length && firstContentRender.current) {
                const filteredList = content.filter(({ END_DT }) => !END_DT);
                let latest = !!filteredList.length ? filteredList.reduce((prev, curr) => moment(curr.CRE_DT).isAfter(moment(prev.CRE_DT)) ? curr : prev) : null;
                if (!!latest) {
                    dispatch(
                        updateState({
                            key: 'localState',
                            value: {
                                ...localState,
                                interviewStartTime: latest.CRE_DT,
                                interviewEndTime: null,
                                interviewStage: 1,
                                INTV_MDE: latest.INTV_MDE,
                                interviewLogGUID: latest.GUID,
                            },
                        })
                    );
                } else {
                    dispatch(
                        updateState({
                            key: 'localState',
                            value: {
                                ...localState,
                                interviewStage: null,
                                INTV_MDE: null,
                            },
                        })
                    );
                }
                firstContentRender.current = false;
            }
        }
    }, [content]);

    useEffect(() => {
        if (props.assignment) {
            let latestLog = {};
            let latestEndLog = {};
            let latestContact = {};
            if (props?.assignment?.InterviewLogListObject?.length) {
                //get latest record with end time
                const completeInterviewList = props.assignment.InterviewLogListObject?.filter(item => item.END_DT != null).map(item => {
                    return ({
                        ...item,
                        compareTime: moment(item.STRT_DT)
                            .set('hour', moment(item.END_DT).hour())
                            .set('minute', moment(item.END_DT).minute())
                            .set('second', moment(item.END_DT).second()
                            )
                    })
                })
                latestEndLog = completeInterviewList?.reduce((prev, curr) => {
                    if (!curr.compareTime) return prev
                    if (!prev) return curr
                    return moment(curr.compareTime).isAfter(moment(prev.compareTime)) ? curr : prev
                }, null)

                setLatestEndLog(latestEndLog)
                latestContact = contactList.find(item => item.GUID == latestEndLog?.HH_CONT_GUID)
            }
            
            if(props.assignment?.Q_DATA_VER_NO){
                setCurrentVersion(props.assignment.Q_DATA_VER_NO)
            }

            setAssignment({
                ...props.assignment,
                LST_VST_MDE: latestEndLog?.INTV_MDE ?? null,
                LST_ENUM_RSLT_CD: latestEndLog?.ENUM_RSLT_CD ?? null,
                LST_VST_TM: latestEndLog?.STRT_DT ?? null,
                LST_VST_PSN: latestEndLog?.STF_NAME_ENG ?? null,
                //upper 4 was using latestLog
                LST_INT_OQ_IND: latestContact?.INT_OQ_IND ?? null,
                LST_PREF_TIME: latestContact?.PREF_TIME ?? null,
                LST_RESPT_LNG: latestContact?.RESPT_LNG ?? null,
                LST_CONT_UPD_DT: latestContact?.UPD_DT ?? null,
                LST_CONT_UPD_BY: latestContact?.UPD_BY_NAME_ENG ?? null,
                LST_RFSL_IND: latestContact?.RFSL_IND ?? null,
                LST_RFSL_LVL: latestContact?.RFSL_LVL ?? null,
                LST_CONT_METH_PREF: latestContact?.CONT_METH_PREF ?? null,
                // LST_END_TM: latestEndLog?.END_DT ?? null,
                LST_END_TM: !props.assignment.InterviewLogListObject?.length ? moment().toString() : latestEndLog?.END_DT ?? null,
            });
        }
    }, [props.assignment]);

    const openInterviewLogDetail = () => {
        setDetailId(null);
        setIsOpenModal(true);
    };

    const updateForm = (key, value, type) => {
        let tempValue = {};
        if (type == 'date') {
            const dateValue = {
                'year': value.split('-')[0],
                'month': parseInt(value.split('-')[1]) - 1,
                'date': value.split('-')[2],
            };
            tempValue = {
                [key]: moment(formContent[key]).set(dateValue).toISOString(true),
            };
        } else {
            tempValue = { [key]: value === '' ? null : value };
        }

        setFormContent((prevInput) => ({
            ...prevInput,
            ...tempValue,
        }));
    };

    const getSubForm = (questionnaire) => {
        return (Utils.searchComponents(questionnaire.components, { type: 'form', }) ?? []);
    };

    const updatePersistState = async (type) => {
        let formIo = null;
        let engList = {};
        let zhList = {};
        switch (type) {
            case 'start': {
                if (!startInterviewContent.INTV_MDE) {
                    setAlertContent({
                        isOpen: true,
                        title: 'Warning',
                        msg: 'Please select interview mode',
                        onClose: () => setAlertContent({ isOpen: false }),
                    });
                    break;
                }

                if (startInterviewContent.INTV_MDE == 'POST') {
                    if (!assignment.Q_DATA_VER_NO) {
                        setAlertContent({
                            isOpen: true,
                            title: 'Warning',
                            msg: 'Cannot choose without submission',
                            onClose: () => setAlertContent({ isOpen: false }),
                        });
                        break;
                    }

                    updatePersistState('doQuestionaire');
                    break;
                }

                //TODO: update interview logic here
                //Create Interview Log
                setIsQuestionnaireDataReady(false);
                await getData('DCP', 'assignment', id).then(async (data) => {
                    const tempInterviewLogGUID = uuid();
                    if (data) {
                        const tempAssignment = Object.assign({}, data);
                        const interviewLogList = tempAssignment.InterviewLogListObject ? tempAssignment.InterviewLogListObject : [];
                        interviewLogList.push({
                            // RecordState: 'I',
                            GUID: tempInterviewLogGUID,
                            STRT_DT: moment().toISOString(true),
                            STRT_DT_SYS: moment().toISOString(true),
                            SUBM_DT: moment().toISOString(true),
                            INTV_MDE: startInterviewContent.INTV_MDE,
                            CRE_BY_NAME_ENG: tokenDecoder().name,
                            CRE_BY_NAME_CHI: tokenDecoder().name_chi,
                            UPD_BY_NAME_ENG: tokenDecoder().name,
                            UPD_BY_NAME_CHI: tokenDecoder().name_chi,
                            CRE_DT: moment().toISOString(true),
                            UPD_DT: moment().toISOString(true),
                            STF_UID: user.id,
                        });

                        const submitData = {
                            ...tempAssignment,
                            InterviewLogListObject: interviewLogList,
                            LST_INTV_LOG_INTV_MDE:
                                startInterviewContent.INTV_MDE,
                        };
                        await updateData('DCP', 'assignment', id, null, submitData);

                        let apiReqBody1 = {
                            InterviewLogSetupList: [
                                {
                                    RecordState: 'I',
                                    GUID: tempInterviewLogGUID,
                                    ASGN_UID: assignment.ASGN_UID,
                                    ASGN_GUID: assignment.GUID,
                                    STRT_DT: moment().toISOString(true),
                                    SUBM_DT: moment().toISOString(true),
                                    RFS_INTVE_INFO: 'N',
                                    INTV_SESS: moment(content.STRT_DT).hours() < 12 ? 'AM' : moment(content.STRT_DT).hours() < 18 ? 'PM' : 'EV',
                                    FU_IND: 'N',
                                    QA_IND: 'N',
                                    INTV_MDE: startInterviewContent.INTV_MDE,
                                },
                            ],
                        };
                        await checkNet(dispatch(setInterviewLog(apiReqBody1)));
                        await dispatch(triggerFetch());

                        dispatch(
                            updateState({
                                key: 'localState',
                                value: {
                                    ...localState,
                                    interviewStartTime: new Date(),
                                    interviewEndTime: null,
                                    interviewStage: 1,
                                    INTV_MDE: startInterviewContent.INTV_MDE,
                                    interviewLogGUID: tempInterviewLogGUID,
                                },
                            })
                        );
                    }
                });

                setStartInterviewContent({
                    isOpen: false,
                });
                break;
            }
            case 'doQuestionaire': {
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
                engList = formIOSchema?.Language ? JSON.parse(formIOSchema.Language) : {};
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
                // const res = {};

                // if(!assignment.Q_DATA_VER_NO){
                let submissionFormIoStr = null;
                const subFormList = Utils.searchComponents(formIOSchema.components, { type: 'form' }).map((form) => ({
                    key: form.key,
                    id: form.form,
                }));

                let questionnaireRes = null;
                try {
                    let version;
                    if(assignment.ASGN_STS=="FUI" && assignment.SubmissionVersionObject && assignment.SubmissionVersionObject.length > 0){
                        let tempVersion = 0;
                        for(let i of assignment.SubmissionVersionObject){
                            if(i.Q_DATA_TYP=="FUQC" && i.Q_DATA_VER_NO > tempVersion){
                                tempVersion = i.Q_DATA_VER_NO
                            }
                        }
                        version = tempVersion;
                    } else {
                        version = assignment.followupSubmission?.find((item) => item.Form_ID == assignment.TEMP_DOC_REF_NO || item.Assignment_Uid == assignment.ASGN_UID)?.Version ?? submissionVersion.Q_DATA_VER_NO ?? assignment.Q_DATA_VER_NO;
                    }                  
                    const res = assignment.Q_DATA_VER_NO ? await dispatch(getSubmissionByAssignmentUidAndVerNo({
                        pAssignmentUid: assignment.ASGN_UID,
                        pQDataVerNo: version,
                    })).unwrap() : null;
                    if(res?.data?.submission && res?.data?.submission.length > 0){
                        questionnaireRes = res?.data?.submission
                    }                    
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
                    
                    submissionFormIoStr = JSON.parse(res?.data?.submission?.find((item) => item.Form_ID == assignment.TEMP_DOC_REF_NO || item.Assignment_Uid == assignment.ASGN_UID)?.Submission_FormIo ?? null);
                    if (!Array.isArray(submissionFormIoStr)) {
                        submissionFormIoStr = [submissionFormIoStr];
                    }
                    subFormList.forEach((form) => {
                        if (!res?.data?.submission?.some((item) => item.Form_ID == form.id)) return;
                        const target = JSON.parse(res?.data?.submission?.find((item) => item.Form_ID == form.id)?.Submission_FormIo ?? null);
                        submissionFormIoStr[0][form.key] = Array.isArray(target) ? target[0] : target;
                    });
                    // if (submissionFormIoStr && submissionFormIoStr[0] !== null) {
                    //     submissionFormIoStr = convertSubmissionFormat(submissionFormIoStr);
                    // }
                } catch (e) {
                    const submission = assignment.followupSubmission?.length ? assignment.followupSubmission : assignment?.submission;
                    submissionFormIoStr = JSON.parse(submission?.find((item) => item.Form_ID == assignment.TEMP_DOC_REF_NO || item.Assignment_Uid == assignment.ASGN_UID)?.Submission_FormIo ?? null)
                }

                //handle "Go to questionnaire" missing interview mode value
                const incompleteInterviewList = props.assignment.InterviewLogListObject?.filter(item => item.END_DT == null).map(item => {
                    return ({
                        ...item,
                        compareTime: moment(item.STRT_DT)
                            .set('hour', moment(item.END_DT).hour())
                            .set('minute', moment(item.END_DT).minute())
                            .set('second', moment(item.END_DT).second()
                            )
                    })
                })

                const latestPendingLog = incompleteInterviewList?.reduce((prev, curr) => {
                    if (!curr.compareTime) return prev
                    if (!prev) return curr
                    return moment(curr.compareTime).isAfter(moment(prev.compareTime)) ? curr : prev
                }, null)

                const curVersionInterview = SubmissionVersionObject.find(item => item.Q_DATA_VER_NO == currentVersion);
                const latestMode = latestPendingLog ?
                                                latestPendingLog?.INTV_MDE : curVersionInterview ?
                                                    curVersionInterview?.ENUM_MDE : startInterviewContent?.INTV_MDE;
                const postMode = curVersionInterview?.ENUM_MDE
                dispatch(updateState({
                    key: 'localState',
                    value: {
                        ...localState,
                        INTV_MDE: startInterviewContent.INTV_MDE == 'POST' ? 'D' : latestMode,
                    }
                }))

                await dispatch(updateQuestionnaireState({
                    key: 'latestVersion',
                    value: assignment.LAT_Q_DATA_VER_NO
                }))

                const title = ['Raw', 'Indoor', 'Follow up', 'Field']

                const followUpSubmissionList =
                    assignment.ASGN_STG_IND == "F" ||
                    assignment.ASGN_STG_IND == "PF"
                        ? [
                              assignment.submission,
                              assignment.indoorSubmission,
                              assignment.followupSubmission,
                              assignment.fieldSubmission,
                          ]
                              .map((item, i) => {
                                  const mainSub =
                                      Array.isArray(item) &&
                                      item.find(
                                          (item) =>
                                              item.Form_ID ==
                                                  assignment.TEMP_DOC_REF_NO ||
                                              item.ASGN_UID ==
                                                  assignment.ASGN_UID
                                      );
                                  if (mainSub) {
                                      return {
                                          ...JSON.parse(
                                              item.find(
                                                  (item) =>
                                                      item.Form_ID ==
                                                          assignment.TEMP_DOC_REF_NO ||
                                                      item.ASGN_UID ==
                                                          assignment.ASGN_UID
                                              ).Submission_FormIo
                                          )[0],
                                          SUBMISSION_NAME: title[i],
                                      };
                                  }
                              })
                              .filter((item) => item)
                        : null;

                let finalSubmission = submissionFormIoStr;

                if ((!finalSubmission[0] && assignment?.prefillList?.length) || (!user.isDefaultOfficer && (user.isEnquiryLogOfficer || user.isTelOperator))) {
                    finalSubmission = [createSubmissionTemplate(formIOSchema, assignment.prefillList, lastRoundData),];
                } else if (assignment?.ENUM_MDE == 'O') {
                    getAllObjects(finalSubmission).forEach((formObj) => {
                        assignment.prefillList.filter(({ FLD_TYP }) => FLD_TYP == 'O' || FLD_TYP == 'S' ).forEach(({ FLD_NAME, FLD_VAL }) => {
                            if (formObj[FLD_NAME]) return;
                            formObj[FLD_NAME] = FLD_VAL[0];
                        });
                    });
                }

                await dispatch(
                    updateQuestionnaireState({
                        key: 'info',
                        value: {
                            // schema: [{
                            //     ...formIOSchema,
                            //     GUID: assignment.TEMP_DOC_REF_NO + '_' + assignment.TMPL_VLD_VER_NO,
                            // }],
                            option: {
                                language: 'zh',
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
                            submission: finalSubmission,
                            // assignment: { ...assignment, INTV_MDE: localState.INTV_MDE }
                            // prefillList: assignment.prefillList,
                            errList: errList,
                            followUpList: followUpList,
                            followUpSubmissionList: followUpSubmissionList,
                            date: {
                                YYYY: assignment.YYYY,
                                MM: assignment.MM,
                            },
                            formGUID: assignment.TEMP_DOC_REF_NO + '_' + assignment.TMPL_VLD_VER_NO,
                        },
                    })
                );

                let currentSubmission = assignment.submission;
                if (assignment.ASGN_STG_IND == 'F' || assignment.ASGN_STG_IND == 'PF') {
                    if (assignment.followupSubmission && assignment.followupSubmission.length) {
                        currentSubmission = assignment.followupSubmission;
                    } else if (assignment.indoorSubmission && assignment.indoorSubmission.length) {
                        currentSubmission = assignment.indoorSubmission;
                    } else {
                        currentSubmission = assignment.submission;
                    }
                }

                await dispatch(
                    updateQuestionnaireState({
                        key: 'drawerList',
                        value: {
                            errCodingList: currentSubmission?.flatMap((sub) => sub.Submission_Error ? JSON.parse(sub.Submission_Error) : []) ?? [],
                            FUList: currentSubmission?.flatMap((sub) => sub.Submission_FollowUp ? JSON.parse(sub.Submission_FollowUp) : []) ?? [],
                            bypassList: currentSubmission?.flatMap((sub) => sub.Submission_ByPass ? JSON.parse(sub.Submission_ByPass) : []) ?? [],
                            clearList: currentSubmission?.flatMap((sub) => sub.Submission_Cleared ? JSON.parse(sub.Submission_Cleared) : []) ?? [],
                        },
                    })
                );

                let url = 'questionnaire';
                if (assignment.ASGN_STG_IND == 'PF' || assignment.ASGN_STG_IND == 'F') {
                    url += '/followUp';
                }

                navigate(url);
                break;
            }
            // case 'end': {
            //     await getData('DCP', 'assignment', id).then(assign => {
            //         const interviewLogList = assign.InterviewLogListObject ?? [];
            //         const targetInterviewLog = interviewLogList.find(item => item.GUID == localState.interviewLogGUID);
            //         setInterviewLogDetailContent({
            //             ...targetInterviewLog,
            //             ASGN_GUID: assignment.GUID,
            //             isCreateTimeLog: true,
            //             PHT_LST: [],
            //             END_DT: targetInterviewLog.END_DT ?? moment().toISOString(true),
            //             END_DT_SYS: targetInterviewLog.END_DT_SYS ?? moment().toISOString(true),
            //         })
            //         setIsOpenModal(true);
            //     })
            //     break;
            // }
            case 'previewQuestionaire': {
                setCurrentVersion(submissionVersion.Q_DATA_VER_NO ?? assignment?.submission?.[0]?.Version ?? 0);
                setIsPreviewOpen(true);
                break;
            }
            default:
                break;
        }
    };

    const createSubmissionTemplate = (schema, prefillList, lastRoundData) => {
        const result = createSubmissionTemplateBody(schema, prefillList, lastRoundData);

        return {
            ...result,
            REFDAY: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
            REFWEEKSTART: new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10),
            REFWEEKEND: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        };
    };
    let tempArr = []
    const createSubmissionTemplateBody = (schema, prefillList, lastRoundData, index = 0, isDatagrid = false) => {
        let submission = isDatagrid ? {
            PSN: (index + 1).toString().padStart(2, '0'),
        } : {};
    
        schema.components.forEach((item) => {
            if (item.components?.length) {
                if (item.type == 'container' || item.type == 'form') {
                    submission[item.key] = createSubmissionTemplateBody(item, prefillList, lastRoundData?.[item.key], index, isDatagrid);
                } else if (item.type == 'datagrid') {
                    const isPP = !!(item.key == 'PP');
                    const initPPCount = JSON.parse(localStorage.getItem('__systemParam__'))?.params.find(({ PARM_CD }) => PARM_CD == 'INIT_PP_CNT')?.PARM_VAL;
                    submission[item.key] = lastRoundData?.[item.key]?.map((dataItem, i) => createSubmissionTemplateBody(item, prefillList, dataItem, i, isPP));
                    if (!submission[item.key]) {
                        if (Object.keys(createSubmissionTemplateBody(item, prefillList, lastRoundData?.[item.key]?.[0], index, isPP)).length) {
                            submission[item.key] = [createSubmissionTemplateBody(item, prefillList, lastRoundData?.[item.key]?.[0], index, isPP),];
                        } else {
                            submission[item.key] = [];
                        }
                    }
                    let PPCount = tempArr.length > 0? tempArr.length : initPPCount;
                    if (submission[item.key].length < PPCount && isPP) {                    
                        const templatePP = Array.from({ length: PPCount - submission[item.key].length, }, (_, i) => ({
                            ...(!tempArr[i+ 1] || tempArr[i+ 1] === undefined ? {} : tempArr[i+ 1]),
                            PSN: (i + 1 + submission[item.key].length).toString().padStart(2, '0'),                         
                        }));
                        submission[item.key].push(...templatePP);
                        tempArr = []
                    }
                } else {
                    submission = {
                        ...submission,
                        ...createSubmissionTemplateBody(item, prefillList, lastRoundData, index, isDatagrid),
                    };
                }
            } else if (item.input) {
                if (prefillList.find((fill) => fill.FLD_NAME == item.key)?.FLD_VAL?.[index]) {
                    const matchedFill = prefillList.find((fill) => fill.FLD_NAME === item.key);
                    if (matchedFill?.FLD_VAL.length > 1) {
                        matchedFill.FLD_VAL.forEach((value, i) => {
                            if (!tempArr[i] || tempArr[i] === undefined) {
                                tempArr[i] = { [item.key]: value };
                            } else {
                                tempArr[i][item.key] = value;
                            }
                        });
                    }
                    submission[item.key] = prefillList.find((fill) => fill.FLD_NAME == item.key).FLD_VAL?.[index];
                } else if (item.defaultValue) {
                    // submission[item.key] = item.defaultValue
                    // } else if (item.inputType == 'text') {
                    //     submission[item.key] = ''
                    // } else if (item.type == 'number' || item.type == 'currency') {
                    //     submission[item.key] = null
                    // } else if (item.type == 'datetime') {
                    //     submission[item.key] = '0000/00/00'
                    // } else if (item.type == 'select' || item.type == 'industry' || item.type == 'occupation' || item.type == 'memberRelationshipCustomComp' || item.type == 'schoolAddress' || item.type == 'residenceAddress' || item.type == 'workAddress') {
                    //     if (item.valueProperty || !(item.data.custom || item.data.url || item.data.json || item.data.resource)) {
                    //         submission[item.key] = ''
                    //     } else {
                    //         submission[item.key] = {}
                    //     }
                } else {
                    // console.log('unknown input', item)
                }
            } else if (item.columns) {
                item.columns.forEach((col) => {
                    submission = {
                        ...submission,
                        ...createSubmissionTemplateBody(col, prefillList, lastRoundData, index, isDatagrid),
                    };
                });
            } else if (item.rows && item.type !== 'textarea') {
                item.rows.forEach((row) => {
                    row.forEach((rowItem) => {
                        submission = {
                            ...submission,
                            ...createSubmissionTemplateBody(rowItem, prefillList, lastRoundData, index, isDatagrid),
                        };
                    });
                });
            } else {
                //console.log('unknown item', item)
            }
        });

        return submission;
    };

    const onClickInterviewLog = (id) => {
        // setDetailId(id);
        const targetInterviewLog = tableContent.find(
            (content) => content.GUID == id
        );
        setInterviewLogDetailContent({
            ...targetInterviewLog,
            isLatestLog: targetInterviewLog.GUID == latestEndLog?.GUID,
            END_DT: targetInterviewLog.END_DT ?? moment().toISOString(true),
            END_DT_SYS: targetInterviewLog.END_DT_SYS ?? moment().toISOString(true),
            ASGN_GUID: assignment.GUID,
            PHT_LST: [],
            HH_CONT_GUID: !targetInterviewLog.HH_CONT_GUID ? 'refuse' : targetInterviewLog.HH_CONT_GUID,
        });
        setIsOpenModal(true);
    };

    const onDeleteInterviewLog = (id) => {
        setConfirmContent({
            isOpen: true,
            title: 'Confirmation',
            msg: () => 'Are your sure to delete this record?',
            onClose: () => setConfirmContent({ isOpen: false }),
            onConfirm: async () => {
                const tempRecordList = [...tableContent];
                const targetRecordIndex = tempRecordList.findIndex((item) => item.GUID == id);

                let apiReqBody = {
                    InterviewLogSetupList: [{
                        GUID: tempRecordList[targetRecordIndex].GUID,
                        ASGN_GUID: assignment.GUID,
                        RecordState: 'D',
                    }],
                };
                await checkNet(dispatch(setInterviewLog(apiReqBody)));

                tempRecordList.splice(targetRecordIndex, 1);

                const outstandingInterviewCount = tempRecordList.filter((item) => item.END_DT == null && user.id == item.STF_UID).length;
                if (outstandingInterviewCount == 0) {
                    //set interviewStage to null for no outstanding case
                    dispatch(
                        updateState({
                            key: 'localState',
                            value: {
                                ...localState,
                                interviewStage: null,
                                INTV_MDE: null,
                            },
                        })
                    );
                }

                updateData('DCP', 'assignment', assignment.GUID, 'InterviewLogListObject', tempRecordList).then(() => {
                    dispatch(triggerFetch());
                    setConfirmContent({ isOpen: false });
                });
            },
        });
    };

    const onEndInterviewLog = async (guid) => {
        await getData('DCP', 'assignment', id).then((assign) => {
            const interviewLogList = assign.InterviewLogListObject ?? [];
            const targetInterviewLog = interviewLogList.find((item) => item.GUID == guid);
            setInterviewLogDetailContent({
                ...targetInterviewLog,
                ASGN_GUID: assignment.GUID,
                isCreateTimeLog: true,
                PHT_LST: [],
                END_DT: targetInterviewLog?.END_DT ?? moment()
                    .set('year', moment(targetInterviewLog?.STRT_DT).year())
                    .set('month', moment(targetInterviewLog?.STRT_DT).month())
                    .set('day', moment(targetInterviewLog?.STRT_DT).day())
                    .toISOString(true),
                END_DT_SYS: targetInterviewLog?.END_DT_SYS ?? moment()
                    .set('year', moment(targetInterviewLog?.STRT_DT).year())
                    .set('month', moment(targetInterviewLog?.STRT_DT).month())
                    .set('day', moment(targetInterviewLog?.STRT_DT).day())
                    .toISOString(true),
            })
            setIsOpenModal(true);
        });
    };

    const onCloseModal = () => {
        setInterviewLogDetailContent(null);
        setIsOpenModal(false);
    };

    const onClickNewAssignment = async (steps, content) => {
        switch (steps) {
            case 1:
                setNewAssignmentContent({
                    isOpen: true,
                    number: 1,
                    pAssignmentType: '',
                    steps: 1,
                });
                return;
            case 2:
                await getData('DCP', 'assignment', assignment.GUID).then(
                    (assign) => {

                        const largestATT = parseInt(assign['AssignmentDetailObject'][0]['MAX_ATT'], 10)
                        const largestHH = parseInt(assign['AssignmentDetailObject'][0]['MAX_HH'], 10)
                        let newRefNo;

                        const pNewAssignmentList = [...Array(parseInt(content.number)),].map((item, index) => {
                            const idx = content.pAssignmentType == 'ATT' ? 1 : 2;
                            if(content.pAssignmentType == 'ATT' ){
                                let asgnRefParts = assign.ASGN_REF_NO.split('-');
                                asgnRefParts[asgnRefParts.length - 1] = '01'; // Replace the last part with "01"
    
                                newRefNo = asgnRefParts.map((v, i) => i !== idx ? v : (largestATT + index + 1).toString().padStart(2, '0')).join('-');
                            }else if(content.pAssignmentType == 'HH' ){
                                newRefNo = assign.ASGN_REF_NO.split('-').map((v, i) => i != idx ? v : (largestHH + index + 1).toString().padStart(2, '0')).join('-');
                            }
                            return {
                                ASGN_GUID: null,
                                QTR_TYP_CD: assign.QTR_TYP ?? "",
                                MAIL_ADDR_ENG_1: assign.MAIL_ADDR_ENG_1,
                                MAIL_ADDR_ENG_2: assign.MAIL_ADDR_ENG_2,
                                MAIL_ADDR_ENG_3: assign.MAIL_ADDR_ENG_3,
                                MAIL_ADDR_ENG_4: assign.MAIL_ADDR_ENG_4,
                                MAIL_ADDR_ENG_5: assign.MAIL_ADDR_ENG_5,
                                MAIL_ADDR_ENG_6: assign.MAIL_ADDR_ENG_6,
                                MAIL_ADDR_CHI_1: assign.MAIL_ADDR_CHI_1,
                                MAIL_ADDR_CHI_2: assign.MAIL_ADDR_CHI_2,
                                MAIL_ADDR_CHI_3: assign.MAIL_ADDR_CHI_3,
                                MAIL_ADDR_CHI_4: assign.MAIL_ADDR_CHI_4,
                                MAIL_ADDR_CHI_5: assign.MAIL_ADDR_CHI_5,
                                MAIL_ADDR_CHI_6: assign.MAIL_ADDR_CHI_6,
                                DCCA_CHI: assign.DCCA_CHI,
                                GUID: uuid(),
                                ASGN_REF_NO: newRefNo,
                                BLDG_TYP:assign.BLDG_TYP,
                                QTR_TYP_CD:assign.QTR_TYP,
                            };
                        });

                        setNewAssignmentContent((prev) => ({
                            ...prev,
                            steps: 2,
                            pNewAssignmentList: pNewAssignmentList,
                            pMainAssignmentAddress: {
                                GUID: uuid(),
                                ASGN_GUID: assignment.GUID,
                                MAIL_ADDR_ENG_1: assign.MAIL_ADDR_ENG_1,
                                MAIL_ADDR_ENG_2: assign.MAIL_ADDR_ENG_2,
                                MAIL_ADDR_ENG_3: assign.MAIL_ADDR_ENG_3,
                                MAIL_ADDR_ENG_4: assign.MAIL_ADDR_ENG_4,
                                MAIL_ADDR_ENG_5: assign.MAIL_ADDR_ENG_5,
                                MAIL_ADDR_ENG_6: assign.MAIL_ADDR_ENG_6,
                                MAIL_ADDR_CHI_1: assign.MAIL_ADDR_CHI_1,
                                MAIL_ADDR_CHI_2: assign.MAIL_ADDR_CHI_2,
                                MAIL_ADDR_CHI_3: assign.MAIL_ADDR_CHI_3,
                                MAIL_ADDR_CHI_4: assign.MAIL_ADDR_CHI_4,
                                MAIL_ADDR_CHI_5: assign.MAIL_ADDR_CHI_5,
                                MAIL_ADDR_CHI_6: assign.MAIL_ADDR_CHI_6,
                                DCCA_CHI: assign.DCCA_CHI,
                                ASGN_REF_NO: assign.ASGN_REF_NO,
                                BLDG_TYP:assign.BLDG_TYP,
                                QTR_TYP_CD:assign.QTR_TYP?? "",
                            },
                        }));
                    }
                );
                return;
            case 3:
                setNewAssignmentContent((prev) => ({
                    ...prev,
                    steps: 3,
                    current: content,
                }));
                return;
            default:
                return 'foo';
        }
    };

    const onChangeUpdateForm = (key, value, type) => {
        let tempValue = {};
        if (type == 'date') {
            const dateValue = {
                'year': value.split('-')[0],
                'month': parseInt(value.split('-')[1]) - 1,
                'date': value.split('-')[2],
            };
            tempValue = {
                [key]: moment(content['key']).set(dateValue).toISOString(true),
            };
        } else if (type == 'file') {
            tempValue = { [key]: [...content[key], ...value] };
        } else {
            tempValue = { [key]: type == 'time' ? moment(content[key]).set('hour', value.split(':')[0]).set('minute', value.split(':')[1]).toISOString(true) : value };
        }

        setNewAssignmentContent((prevInput) => ({
            ...prevInput,
            ...tempValue,
        }));
    };

    const generateNewAssignmentDetail = (content) => {
        return (
            <Container
                onClick={() => onClickNewAssignment(3, content)}
                variant='whiteShadow'
                className="editAsgnContainer"
            >
                <div className="fieldItem full">
                    <label>
                        Assignment Ref.
                    </label>
                    <div className="inputItem">
                        <Input
                            value={content.ASGN_REF_NO}
                            disabled />
                    </div>
                </div>
                <div className="fieldItem full">
                    <label>Address</label>
                    <div className="inputItem">
                        <Input
                            value={[content.MAIL_ADDR_ENG_1, content.MAIL_ADDR_ENG_2, content.MAIL_ADDR_ENG_3, content.MAIL_ADDR_ENG_4, content.MAIL_ADDR_ENG_5, content.MAIL_ADDR_ENG_6].join(", ")}
                        />
                    </div>
                </div>
            </Container>
        );
    };

    const onChangeNewAssignmentAddress = (key, value, type) => {
        let tempValue = {};
        if (type == 'date') {
            const dateValue = {
                'year': value.split('-')[0],
                'month': parseInt(value.split('-')[1]) - 1,
                'date': value.split('-')[2],
            };
            tempValue = {
                key: moment(content[key]).set(dateValue).toISOString(true),
            };
            setNewAssignmentContent((prev) => ({
                ...prev,
                current: {
                    ...prev.current,
                    ...tempValue,
                },
            }));
        } else {
            tempValue = { [key]: type == 'time' ? moment(content[key]).set('hour', value.split(':')[0]).set('minute', value.split(':')[1]).toISOString(true) : value };
            setNewAssignmentContent((prev) => ({
                ...prev,
                current: {
                    ...prev.current,
                    ...tempValue,
                },
            }));
        }
    };

    const onSaveNewAssignmentAddress = () => {
        const tempNewAssignmentContent = Object.assign({}, newAssignmentContent);
        if (tempNewAssignmentContent.pMainAssignmentAddress.GUID == tempNewAssignmentContent.current.GUID) {
            tempNewAssignmentContent.pMainAssignmentAddress = tempNewAssignmentContent.current;
        } else {
            const targetIndex = tempNewAssignmentContent.pNewAssignmentList.findIndex((target) => target.GUID == tempNewAssignmentContent.current.GUID);
            tempNewAssignmentContent.pNewAssignmentList.splice(targetIndex, 1, tempNewAssignmentContent.current);
        }
        tempNewAssignmentContent.steps = 2;
        setNewAssignmentContent(tempNewAssignmentContent);
    };

    const submitNewAssignment = async () => {
        await createNewAssignment(assignment.GUID, {}, newAssignmentContent, dispatch);
        setNewAssignmentContent({
            isOpen: false,
        });
        setAlertContent({
            isOpen: true,
            title: 'Notification',
            msg: 'Create successfully.',
            onClose: () => {
                setAlertContent({
                    isOpen: false,
                    msg: '',
                    onClose: null,
                });
            },
        });
    };

    const onChangeStartInterviewContent = (key, value, type) => {
        let tempValue = {};
        tempValue = { [key]: type == 'time' ? moment(content[key]).set('hour', value.split(':')[0]).set('minute', value.split(':')[1]).toISOString(true) : value, };

        setStartInterviewContent((prev) => ({
            ...prev,
            ...tempValue,
        }));
    };

    /** mantis 8706 */
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

    /*
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
        // if (Submission_FormIo_Obj && Submission_FormIo_Obj[0] !== null) {
        //     Submission_FormIo_Obj = convertSubmissionFormat(Submission_FormIo_Obj);
        // }
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

        // navigate('questionnaire/preview')

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
    }

    const navigatePreview = async (content) => {
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
        
        await dispatch(updateQuestionnaireState({
            key: 'info',
            value: {
                // schema: [{
                //     ...formIOSchema,
                //     GUID: assignment.TEMP_DOC_REF_NO + '_' + assignment.TMPL_VLD_VER_NO,
                // }],
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
                // assignment: { ...assignment, INTV_MDE: localState.INTV_MDE },
                submission: Submission_FormIo_Obj,
                errList: errList,
                followUpList: followUpList,
                formGUID: assignment.TEMP_DOC_REF_NO + '_' + assignment.TMPL_VLD_VER_NO,
                date: {
                    YYYY: assignment.YYYY,
                    MM: assignment.MM,
                },
                // QuestionnaireImages: images
            }
        }))

        await dispatch(
            updateQuestionnaireState({
                key: 'drawerList',
                value: {
                    errCodingList: submission?.flatMap((sub) => sub.Submission_Error ? JSON.parse(sub.Submission_Error) : []) ?? [],
                    FUList: submission?.flatMap((sub) => sub.Submission_FollowUp ? JSON.parse(sub.Submission_FollowUp) : []) ?? [],
                    bypassList: submission?.flatMap((sub) => sub.Submission_ByPass ? JSON.parse(sub.Submission_ByPass) : []) ?? [],
                    clearList: submission?.flatMap((sub) => sub.Submission_Cleared ? JSON.parse(sub.Submission_Cleared) : []) ?? [],
                },
            })
        );
        await dispatch(updateQuestionnaireState({
            key: 'latestVersion',
            value: content.Q_DATA_VER_NO - 1,
        }));

        navigate('questionnaire/preview');
    };

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
    */

    const onClickViewImageList = (id) => {
        const targetInterviewLog = tableContent.find((item) => item.GUID == id);
        setImageDetail((prev) => ({
            ...prev,
            imageList: targetInterviewLog.PHT_LST,
            isOpen: true,
        }));
    };

    const onClickImage = (detail) => {
        setImageDetail((prev) => ({
            ...detail,
            isOpen: true,
            imageList: prev.imageList,
        }));
    };


    const saveSubmissionVersion = async () => {
        const selected = SubmissionVersionObject.find(
            (item) => item.Q_DATA_VER_NO == currentVersion
        );
        setSubmissionVersion(selected);
        setIsPreviewOpen(false);
        await dispatch(
            updateQuestionnaire({
                assignmentQuestionnaireVersionSetList: {
                    RecordState: "U",
                    ASGN_UID: assignment.ASGN_UID,
                    RAW_VER_NO: selected.Q_DATA_VER_NO,
                    RAW_ENUM_MDE: selected.ENUM_MDE,
                },
                questionnaireDataInfoSetList: {
                    RecordState: "U",
                    ASGN_UID: assignment.ASGN_UID,
                    Q_DATA_VER_NO: selected.Q_DATA_VER_NO,
                },
            })
        );
        dispatch(triggerFetch());
    };

    function deepClone(obj) {
        // Check if the input is an object or array, otherwise return the value
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // Create an array or object to hold the values
        const clone = Array.isArray(obj) ? [] : {};

        // Recursively copy the properties
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                clone[key] = deepClone(obj[key]);
            }
        }

        return clone;
    }

    /** mantis 8706 */
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


    // console.log('[assignment]', assignment)
    // console.log('[assignment]count', assignment?.InterviewLogListObject?.filter(interviewLog=> interviewLog.STF_UID == user.id && interviewLog.END_DT == null).length )
    return (
        <>
            <DataForm
                tableStructure={formStructure}
                content={assignment}
                updateFormAction={null}
                submitAction={null}
                mode={'view'}
                colspan={2}
                flexDir={'row'}
            />
            <div className='respondent_preferences'>
                <div className="titleWrapper">
                    <div className="fieldItem">
                        <label>Respondent's Preferences in Interview</label>
                    </div>
                </div>
                <div className='information'>
                    <DataForm
                        tableStructure={preference_formStructure}
                        content={assignment}
                        updateFormAction={null}
                        submitAction={null}
                        mode={'view'}
                        colspan={2}
                        flexDir={'row'}
                    />
                </div>
            </div>
            {/* <Container className='tabContainer'>
                <Button variant='blue' onClick={() => updatePersistState('start')}>
                    Start Interview
                </Button>
                <Button variant='purple' onClick={() => updatePersistState('doQuestionaire')} isDisabled={localState.interviewStage != 1}>
                    Go To Questionnaire
                </Button>
                <Button variant='blue' onClick={() => updatePersistState('end')}>
                    End Interview
                </Button>
                <Button variant='yellow' onClick={() => updatePersistState('previewQuestionaire')}>
                    Preview Questionnaire
                </Button>
                <Button variant='purple' className='btnCreateAsgn'>
                    New Assignment
                </Button>
            </Container> */}
            <div className="topControlBtns q_buttons">
                <div className="btnGroup">
                    <Button
                        variant="blue"
                        onClick={() => setStartInterviewContent({
                            isOpen: true,
                            INTV_MDE: '',
                        })}
                        // isDisabled={!assignment.LST_END_TM || ((assignment.ASGN_STG_IND != 'D' && assignment.ASGN_STG_IND != 'F' && assignment.ASGN_STG_IND != 'PF') || assignment.ASGN_STS == 'CMP')}>
                        isDisabled={
                            (assignment.ASGN_STG_IND != 'D' && assignment.ASGN_STG_IND != 'F' && assignment.ASGN_STG_IND != 'PF')
                            || assignment.ASGN_STS == 'CMP'
                            || assignment.ASGN_STS == 'EOEP'
                            || assignment.ASGN_STS == 'QSP'
                            || assignment.ASGN_STS == 'EOFP'
                            || assignment.ASGN_STS == 'EOPFP'
                            || assignment.ASGN_STS == 'FQSP'
                            || assignment.ASGN_STS == 'PFQSP' /*|| assignment.ASGN_STS == 'EOEA'*/ 
                            || !isQuestionnaireDataReady
                        }
                    >
                        Start Interview
                    </Button>
                    {
                        //!assignment.LST_END_TM
                        //exist an interview log not end yet and created by user
                        assignment?.InterviewLogListObject?.filter(
                            (interviewLog) => interviewLog.STF_UID == user.id && interviewLog.END_DT == null).length > 0 && (
                            <Button
                                variant="purple"
                                onClick={() => updatePersistState('doQuestionaire')}
                                isDisabled={assignment.ASGN_STS == 'EOEP' || assignment.ASGN_STS == 'QSP' || !isQuestionnaireDataReady /*|| assignment.ASGN_STS == 'EOEA'*/}
                            >
                                Go To Questionnaire
                            </Button>
                        )
                    }

                    {/* <Button onClick={() => openInterviewLogDetail()}> */}
                    {/*{*/}
                    {/*    !assignment.LST_END_TM &&*/}
                    {/*    <Button variant="blue" onClick={() => updatePersistState('end')} >*/}
                    {/*        End Interview*/}
                    {/*    </Button>*/}
                    {/*}*/}
                    {(tokenDecoder().isDefaultOfficer ||
                        !tokenDecoder().isTelOperator) && (
                            <div className="flex gap-2.5">
                                {
                                    pageSrc !== 'eField' &&                                
                                    <Button
                                        variant="yellow"
                                        onClick={() =>
                                            updatePersistState("previewQuestionaire")
                                        }
                                        isDisabled={!isQuestionnaireDataReady}
                                    >
                                        Preview Questionnaire
                                    </Button>
                                }
                                {
                                    // assignment?.prefillList?.some(item => item.FLD_TYP === 'Q') && assignment?.submission?.length > 0 &&
                                    assignment?.lastRoundSubmission?.length > 0 &&
                                    <Button variant="green" onClick={() => {
                                        navigatePrefill(content,false)}} disabled={!isQuestionnaireDataReady}>
                                        View Pre-filled Answer
                                    </Button>
                                }
                            </div>
                        )}
                </div>
                <div className="btnGroup">
                    <Button variant="purple" className="btnCreateAsgn" onClick={() => { onClickNewAssignment(1, newAssignmentContent); }}>
                        New Assignment
                    </Button>
                </div>
            </div>
            <DataTable
                tableStructure={tableStructure}
                tableContent={tableContent}
                variant={'roundedGreyHeaderOpenBottom'}
                setTableContent={setTableContent}
                formContent={formContent}
            />
            {generatePageController(formContent?.offSet, formContent?.page, updateForm, 5, tableContent?.length, formContent?.pageSize)}
            <DisplayDataModal
                title={'Interview Log Detail'}
                onCloseModal={onCloseModal}
                isModalOpen={isOpenModal}
                isFixSize={false}
            >
                <InterviewlogDetail
                    // id={detailId}
                    content={interviewLogDetailContent}
                    startTime={startTime}
                    assignment={assignment}
                    onCloseModal={onCloseModal}
                    contactList={contactList}
                    assignmentList={assignmentList}
                />
            </DisplayDataModal>
            <DisplayDataModal
                title={'Create New Assignment'}
                customClass={"smallFormContainer"}
                onCloseModal={() => setNewAssignmentContent((prev) => ({ ...prev, isOpen: prev.steps == 1 ? false : prev.isOpen, number: prev.steps == 1 ? 1 : prev.number, steps: prev.steps == 3 ? 2 : 1, }))}
                isModalOpen={newAssignmentContent.isOpen}
                isFixSize={true}
            // minH={400}
            >
                {newAssignmentContent.steps == 1 ? (
                    <DataForm
                        tableStructure={newAssignmentContentStructure}
                        content={newAssignmentContent}
                        updateFormAction={onChangeUpdateForm}
                        submitAction={() => onClickNewAssignment(2, newAssignmentContent)}
                        customBtnTxt='Next'
                    />
                ) : newAssignmentContent.steps == 2 ? (
                    <div className="createAsngContainer">
                        <div className="titleWrapper">
                            <label>Parent Assignment</label>
                        </div>
                        {generateNewAssignmentDetail(newAssignmentContent.pMainAssignmentAddress)}
                        <div className="remarks">
                            <label class="textRed">Press on each record to edit the details. <br />Once created, the details cannot be further edited using tablet.</label>
                            <label>Note: Temporary Assignment No. are listed as reference ONLY, they may change after creation on server</label>
                        </div>
                        {newAssignmentContent.pAssignmentType == 'ATT' && (
                            <div className="fieldItem full">
                                <label>Search:</label>
                                <div className="inputItem">
                                    <Select
                                        onChange={(e) =>
                                            onChangeUpdateForm('pSearchIndicator', e.target.value, null)
                                        }
                                        value={newAssignmentContent.pSearchIndicator}
                                    >
                                        {searchIndexList?.map((option) => {
                                            return (<option value={option.value}>{option.label}</option>);
                                        })}
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="titleWrapper"><label>New Assignment</label></div>
                        {
                            newAssignmentContent.pNewAssignmentList.map((newAssign) => generateNewAssignmentDetail(newAssign))
                        }
                        <div class="bottomCtrlBtnsWrapper center">
                            <Button variant="blue" onClick={() => submitNewAssignment()}>
                                Save
                            </Button>
                        </div>
                    </div>
                ) : newAssignmentContent.steps == 3 ? (
                    <DataForm
                        tableStructure={newAssignmentCurrentAddressStructure}
                        content={newAssignmentContent.current}
                        updateFormAction={onChangeNewAssignmentAddress}
                        submitAction={() => onSaveNewAssignmentAddress()}
                        customBtnTxt='Save & Back'
                    />
                ) : ('')}
            </DisplayDataModal>
            <DisplayDataModal
                title={'Start Interview'}
                onCloseModal={() => setStartInterviewContent({ isOpen: false })}
                isModalOpen={startInterviewContent.isOpen}
                isFixSize={true}
                customClass={"smallFormContainer"}
            // minH='300'
            >
                <DataForm
                    tableStructure={startInterviewContent_structure}
                    content={startInterviewContent}
                    updateFormAction={onChangeStartInterviewContent}
                    submitAction={() => updatePersistState('start')}
                />
            </DisplayDataModal>
            <DisplayDataModal
                title={'Submit Version'}
                onCloseModal={() => setIsPreviewOpen(false)}
                isModalOpen={isPreviewOpen}
                isFixSize={false}
                h='100%'
                w='100%'
                maxW='100%'
            >
                <DataTable
                    tableStructure={submitVersionStructure}
                    tableContent={SubmissionVersionObject}
                />
                <div class="buttonContainer center">
                    <Button variant="blue" onClick={saveSubmissionVersion} isDisabled={!isOnline || (assignment.ASGN_STS != 'PE' && assignment.ASGN_STS != 'EIP' && assignment.ASGN_STS != 'QSR')} >
                        Save
                    </Button>
                </div>
            </DisplayDataModal>

            {/*<QuestionaireForm*/}
            {/*    schema={formSchema}*/}
            {/*    isPreview={isQuestionairePreview}*/}
            {/*    option={{*/}
            {/*        // language: 'en',*/}
            {/*        i18n: {*/}
            {/*            en: {*/}
            {/*                ...formSchema.Language*/}

            {/*            },*/}
            {/*            default: {*/}

            {/*            }*/}
            {/*        },*/}
            {/*        // readOnly: true,*/}
            {/*        // showHiddenFields: true,*/}
            {/*        buttonSettings: { showSubmit: false, showCancel: false }*/}
            {/*    }}*/}
            {/*    title={'Questionaire'}*/}
            {/*    modalOpen={isOpenFormModal}*/}
            {/*    onClose={setIsOpenFormModal}*/}
            {/*// submit={handleSubmission}*/}
            {/*// gridColumnCount={gridColumnCount}*/}
            {/*/>*/}
            <AlertModal content={alertContent} />
            <DisplayDataModal
                title={'Interview Log Image'}
                onCloseModal={() => {
                    setImageDetail((prev) => !prev.GUID ? {
                        isOpen: false,
                    } : {
                        imageList: prev.imageList,
                        isOpen: true,
                    });
                }}
                isModalOpen={imageDetail.isOpen}
            // isFixSize={true}
            >
                <div className="popupForm segmentMapForm">
                    <Box className="modalContainer">
                        {imageDetail.GUID ? (
                            <DataForm
                                tableStructure={imageDetailDataFormStructure}
                                content={imageDetail}
                            />
                        ) : (
                            <DataTable
                                tableStructure={imageDetailTableStructure}
                                tableContent={imageDetail?.imageList}
                                variant={'roundedGreyHeaderOpenBottom'}
                                setTableContent={(content) => setImageDetail((prev) => ({ ...prev, imageList: content }))}
                            />
                        )}
                    </Box>
                </div >
            </DisplayDataModal>
            <DisplayDataModal
                title={`View Pre-filled Answer`}
                onCloseModal={() => setVerifyDetail(null)}
                isModalOpen={verifyDetail}
                customClass='popupVerForm'
            >
                <QuestionnairePrefillTable
                    schema={prefillSchema}
                    formContent={prefillFormContent}
                    locale={prefillLocale}
                    latestVersion={prefillLatestVersion}
                />
                {(type != 'preview' && type != 'formBuilder') && <Button
                    variant='blue'
                    onClick={async () => {
                                setInitSubmit({ verify: true })
                                setInitVerify({ verify: true })
                    }}
                    isDisabled={!!initSubmit}
                >
                    {type == 'approval' ? 'Approve with Cursory Check' : 'Save'}
                </Button>}
            </DisplayDataModal>
            <ConfirmModal1 content={confirmContent} />
        </>
    );
}

function mapStateToProps(state) {
    const { interviewLog, assignment, common, questionnaire } = state;
    return {
        // data: interviewLog.interviewLogData,
        // totalPage: interviewLog.totalPage,
        // totalCount: interviewLog.totalCount,
        localState: assignment.localState,
        newAssignmenTypeList: common.newAssignmenTypeList,
        quartersTypeList: common.quartersTypeList,
        searchIndexList: common.searchIndexList,
        interviewModeList: common.interviewModeList,
        contactLanguageList: common.contactLanguageList,
        intentionOQList: common.intentionOQList,
        assignRefuseLvlList: common.assignRefuseLvlList,
        contactPrefList: common.contactPrefList,
        contactTimePrefList: common.contactTimePrefList,
        assignRefuseIndList: common.assignRefuseIndList,
        enumResultList: common.enumResultList,
        ReferTIFailReasonList: common.ReferTIFailReasonList,
        questionnaireDataStatusList: common.questionnaireDataStatusList,
        questionnaireDataTypeList: common.questionnaireDataTypeList,
        lastRoundData: questionnaire.lastRoundData,
        contactTitleList: common.contactTitleList,
        EnumerationModesList: common.EnumerationModesList,
    };
}

export default connect(mapStateToProps)(InterviewLog);
